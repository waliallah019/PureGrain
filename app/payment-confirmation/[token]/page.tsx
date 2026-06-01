"use client";

import { useEffect, useState, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, CreditCard, Building2, User, Mail, Calendar, Upload, FileText, Loader2 } from 'lucide-react';

interface PaymentConfirmationData {
  requestType: 'Sample' | 'Quote' | 'Custom';
  requestId: string;
  requestNumber: string;
  companyName: string;
  contactPerson?: string;
  customerName?: string;
  email: string;
  expectedAmount?: number;
  currency?: string;
  status: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: PaymentConfirmationData;
  error?: string;
}

type PaymentType = 'Sample Request' | 'Quote Request' | 'Custom Request';
type PaymentMethod = 'Wise' | 'Bank Transfer' | 'PayPal' | 'Other';

interface PaymentFormData {
  paymentType: PaymentType | '';
  paidAmount: string;
  paymentMethod: PaymentMethod | '';
  paymentProof: File | null;
}

interface FormErrors {
  paymentType?: string;
  paidAmount?: string;
  paymentMethod?: string;
  paymentProof?: string;
}

export default function PaymentConfirmationPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentConfirmationData | null>(null);

  // Form state
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentType: '',
    paidAmount: '',
    paymentMethod: '',
    paymentProof: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    const fetchPaymentConfirmation = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payment-confirmation/${token}`);
        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to validate payment confirmation link');
        } else if (result.data) {
          setData(result.data);
          const derivedType = `${result.data.requestType} Request` as PaymentType;
          setFormData((prev) => ({ ...prev, paymentType: derivedType }));
        }
      } catch (err) {
        console.error('Error fetching payment confirmation:', err);
        setError('An error occurred while validating the payment link');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentConfirmation();
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return 'Not specified';
    return `${currency || 'USD'} ${amount.toFixed(2)}`;
  };

  // Form handlers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => ({
        ...prev,
        paymentProof: 'Please upload a PNG, JPEG, or PDF file'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({
        ...prev,
        paymentProof: 'File size must be less than 5MB'
      }));
      return;
    }

    setFormData(prev => ({ ...prev, paymentProof: file }));
    setFormErrors(prev => ({ ...prev, paymentProof: undefined }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.paymentType) {
      errors.paymentType = 'Payment type is required';
    }

    if (!formData.paidAmount || formData.paidAmount === '0') {
      errors.paidAmount = 'Amount is required';
    } else if (parseFloat(formData.paidAmount) <= 0) {
      errors.paidAmount = 'Amount must be greater than 0';
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }

    if (!formData.paymentProof) {
      errors.paymentProof = 'Payment proof is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Prepare form data for multipart/form-data submission
      const submitFormData = new FormData();
      submitFormData.append('token', token);
      
      // Map form field values to API expectations
      const requestTypeMap: Record<string, string> = {
        'Sample Request': 'sample',
        'Quote Request': 'quote',
        'Custom Request': 'custom'
      };
      submitFormData.append('request_type', requestTypeMap[formData.paymentType] || 'sample');
      submitFormData.append('amount', formData.paidAmount);
      submitFormData.append('payment_method', formData.paymentMethod);
      
      if (formData.paymentProof) {
        submitFormData.append('proof_file', formData.paymentProof);
      }

      // Submit to API
      const response = await fetch('/api/payment-confirmations', {
        method: 'POST',
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit payment confirmation');
      }

      // Success
      setSubmitSuccess(true);
      setSubmitMessage(result.message || 'Your payment confirmation has been submitted and is pending review.');
      
      // Reset form after successful submission
      resetForm();
      
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting payment confirmation:', err);
      setSubmitError(
        err instanceof Error 
          ? err.message 
          : 'Failed to submit payment confirmation. Please try again or contact support.'
      );
      
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      paymentType: '',
      paidAmount: '',
      paymentMethod: '',
      paymentProof: null,
    });
    setFormErrors({});
    setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow section-padding overflow-x-clip bg-gradient-to-b from-bone/70 via-background to-background dark:from-muted/25 dark:via-background dark:to-background">
        <div className="container-wide overflow-x-clip">
          <div className="mb-10 max-w-3xl">
            <p className="text-label text-brass mb-3">Payment Confirmation</p>
            <h1 className="heading-subsection text-foreground mb-4">Confirm Your Transfer</h1>
            <div className="divider-brass mb-5" />
            <p className="text-muted-foreground">
              Submit your transfer proof so our team can verify payment and process your request quickly.
            </p>
          </div>

          {loading ? (
            <Card className="max-w-4xl mx-auto card-industrial shadow-lg">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="max-w-4xl mx-auto shadow-lg border-red-200 dark:border-red-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <CardTitle className="text-red-600 dark:text-red-400">Invalid Link</CardTitle>
                    <CardDescription>Unable to verify payment confirmation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="mt-6 flex gap-4">
                  <Button asChild variant="outline">
                    <Link href="/">Return Home</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : data ? (
            <div className="grid xl:grid-cols-5 gap-6 lg:gap-8 items-start min-w-0">
              <div className="xl:col-span-2 space-y-6 xl:sticky xl:top-24 min-w-0">
                <Card className="card-industrial shadow-sm w-full min-w-0">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <CardTitle>Request Overview</CardTitle>
                        <CardDescription>
                          Verify the details before submitting proof.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Request Type</span>
                      <Badge
                        variant={data.requestType === 'Sample' ? 'default' : 'secondary'}
                        className="text-sm px-3 py-1 shrink-0 w-fit"
                      >
                        {data.requestType} Request
                      </Badge>
                    </div>

                    <div className="space-y-4 border-t border-border pt-4">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Request Number</p>
                          <p className="text-base font-semibold break-words">{data.requestNumber || data.requestId}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
                          <p className="text-base break-words">{data.companyName}</p>
                        </div>
                      </div>

                      {(data.contactPerson || data.customerName) && (
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                            <p className="text-base break-words">{data.contactPerson || data.customerName}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                          <p className="text-base break-all">{data.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Request Date</p>
                          <p className="text-base">{formatDate(data.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {data.expectedAmount && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900">
                    <CreditCard className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    <AlertTitle className="text-amber-900 dark:text-amber-100">Expected Amount</AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <span className="text-xl font-bold">{formatAmount(data.expectedAmount, data.currency)}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Make sure your payment amount and request details are correct before submitting proof.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="xl:col-span-3 min-w-0">
                <Card className="card-industrial shadow-lg border-brass/30 w-full min-w-0">
                  <CardHeader>
                    <CardTitle className="text-2xl">Upload Payment Proof</CardTitle>
                    <CardDescription>
                      Attach your transfer receipt and submit for verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Success Message */}
                    {submitSuccess && (
                      <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-900 dark:text-green-100">
                          Submission Successful
                        </AlertTitle>
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          {submitMessage}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Error Message */}
                    {submitError && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Submission Failed</AlertTitle>
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Type */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentType">
                        Payment Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.paymentType}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, paymentType: value as PaymentType }));
                          setFormErrors(prev => ({ ...prev, paymentType: undefined }));
                        }}
                      >
                        <SelectTrigger id="paymentType" className={formErrors.paymentType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sample Request">Sample Request</SelectItem>
                          <SelectItem value="Quote Request">Quote Request</SelectItem>
                          <SelectItem value="Custom Request">Custom Request</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.paymentType && (
                        <p className="text-sm text-red-500">{formErrors.paymentType}</p>
                      )}
                    </div>

                    {/* Paid Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount">
                        Paid Amount (USD) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="paidAmount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.paidAmount}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, paidAmount: e.target.value }));
                            setFormErrors(prev => ({ ...prev, paidAmount: undefined }));
                          }}
                          className={`pl-8 ${formErrors.paidAmount ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {formErrors.paidAmount && (
                        <p className="text-sm text-red-500">{formErrors.paidAmount}</p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">
                        Payment Method <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }));
                          setFormErrors(prev => ({ ...prev, paymentMethod: undefined }));
                        }}
                      >
                        <SelectTrigger id="paymentMethod" className={formErrors.paymentMethod ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wise">Wise</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.paymentMethod && (
                        <p className="text-sm text-red-500">{formErrors.paymentMethod}</p>
                      )}
                    </div>

                    {/* Payment Proof Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentProof">
                        Payment Proof <span className="text-red-500">*</span>
                      </Label>
                      <div className="space-y-4">
                        <div
                          className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors ${
                            formErrors.paymentProof ? 'border-red-500' : 'border-muted-foreground/25'
                          }`}
                        >
                          <input
                            id="paymentProof"
                            type="file"
                            accept="image/png,image/jpeg,application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isSubmitting}
                          />
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPEG, or PDF (max 5MB)
                          </p>
                        </div>

                        {/* File Preview/Name */}
                        {formData.paymentProof && (
                          <div className="space-y-3">
                            {previewUrl ? (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                <Image
                                  src={previewUrl}
                                  alt="Payment proof preview"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                                <FileText className="w-6 h-6 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {formData.paymentProof.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(formData.paymentProof.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, paymentProof: null }));
                                setPreviewUrl(null);
                              }}
                            >
                              Remove File
                            </Button>
                          </div>
                        )}

                        {formErrors.paymentProof && (
                          <p className="text-sm text-red-500">{formErrors.paymentProof}</p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                      <Button
                        type="submit"
                        className="w-full sm:flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Payment Confirmation
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>

                  {/* Action Buttons */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-border">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/contact">Contact Support</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/">Return Home</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
