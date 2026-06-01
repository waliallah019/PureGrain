"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Clock, CheckCircle, XCircle, Send, Truck, DollarSign,
  ArrowLeft, User, Mail, Phone, MapPin, Package, Building, Link as LinkIcon, Download, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import Link from 'next/link';

import { IQuoteRequest, QuoteRequestStatus, QuotePaymentMethod } from '@/types/quote';
import { IInvoice, PaymentTerms } from '@/types/invoice';
import { countries } from '@/lib/config/shippingConfig';
import PaymentConfirmationsSection from '@/components/admin/PaymentConfirmationsSection';


// Component for the invoice generation form
const InvoiceForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  quote: IQuoteRequest;
  onInvoiceGenerated: (invoice: IInvoice) => void;
}> = ({ isOpen, onClose, quote, onInvoiceGenerated }) => {
  const [proposedPricePerUnit, setProposedPricePerUnit] = useState<number>(quote.proposedPricePerUnit || 0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(quote.paymentMethod === '100_advance_bank_transfer' ? '100_advance' : quote.paymentMethod === '30_70_split_bank_transfer' ? '30_70_split' : quote.paymentMethod === 'letter_of_credit' ? 'lc' : '100_advance');
  const [paymentInstructions, setPaymentInstructions] = useState<string>(quote.paymentDetails?.customTerms || '');
  const [notes, setNotes] = useState<string>(quote.adminComments || '');
  // LC specific fields
  const [lcBankName, setLcBankName] = useState<string>(quote.lcDetails?.bankName || '');
  const [lcContactPerson, setLcContactPerson] = useState<string>(quote.lcDetails?.contactPerson || '');
  const [lcContactEmail, setLcContactEmail] = useState<string>(quote.lcDetails?.contactEmail || '');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProposedPricePerUnit(quote.proposedPricePerUnit || 0);
      setTaxRate(0);
      setShippingCost(0);
      setPaymentTerms(quote.paymentMethod === '100_advance_bank_transfer' ? '100_advance' : quote.paymentMethod === '30_70_split_bank_transfer' ? '30_70_split' : quote.paymentMethod === 'letter_of_credit' ? 'lc' : '100_advance');
      setPaymentInstructions(quote.paymentDetails?.customTerms || '');
      setNotes(quote.adminComments || '');
      setLcBankName(quote.lcDetails?.bankName || '');
      setLcContactPerson(quote.lcDetails?.contactPerson || '');
      setLcContactEmail(quote.lcDetails?.contactEmail || '');
    }
  }, [isOpen, quote]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (proposedPricePerUnit <= 0) {
        toast.error("Proposed price per unit must be greater than 0.");
        setLoading(false);
        return;
      }
      if (paymentTerms === 'lc' && !lcBankName) {
        toast.error("LC Bank Name is required for Letter of Credit payment terms.");
        setLoading(false);
        return;
      }

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests/${quote._id}/invoice`,
        {
          proposedPricePerUnit: Number(proposedPricePerUnit),
          taxRate: Number(taxRate),
          shippingCost: Number(shippingCost),
          paymentTerms,
          paymentInstructions,
          notes,
          lcBankName: paymentTerms === 'lc' ? lcBankName : undefined,
          lcContactPerson: paymentTerms === 'lc' ? lcContactPerson : undefined,
          lcContactEmail: paymentTerms === 'lc' ? lcContactEmail : undefined,
        }
      );

      if (response.data.success) {
        toast.success("Invoice generated and sent successfully!");
        onInvoiceGenerated(response.data.data as IInvoice);
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to generate invoice.");
      }
    } catch (err: any) {
      console.error("Invoice generation error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message;
      const errors = err.response?.data?.errors?.map((e:any) => `${e.path}: ${e.message}`).join(', ') || '';
      toast.error(`Failed to generate invoice: ${errorMessage}. ${errors}`);
    } finally {
      setLoading(false);
    }
  };

  const totalCalculatedPrice = (quote.quantity * proposedPricePerUnit) + shippingCost + (quote.quantity * proposedPricePerUnit * taxRate);

  // FIX: Define displayId for dialog title
  const dialogDisplayId = quote.requestNumber || (quote._id as string).substring(0, 8) + '...';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice for Quote: {dialogDisplayId}</DialogTitle> {/* FIX: Use dialogDisplayId */}
          <DialogDescription>
            Set pricing, taxes, shipping, and payment terms for the invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p><strong>Item:</strong> {quote.itemName} ({quote.quantity} {quote.quantityUnit})</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposedPricePerUnit">Proposed Price Per Unit (USD)</Label>
              <Input
                id="proposedPricePerUnit"
                type="number"
                step="0.01"
                value={proposedPricePerUnit}
                onChange={(e) => setProposedPricePerUnit(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost (USD)</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRate * 100}
                onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
              />
            </div>
             <div className="space-y-2">
              <Label>Calculated Total Price</Label>
              <Input value={`$${totalCalculatedPrice.toFixed(2)} USD`} readOnly />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Select value={paymentTerms} onValueChange={(value: string) => setPaymentTerms(value as PaymentTerms)}>
              <SelectTrigger id="paymentTerms">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100_advance">100% Advance (Bank Transfer)</SelectItem>
                <SelectItem value="30_70_split">30/70 Split (Bank Transfer)</SelectItem>
                <SelectItem value="lc">Letter of Credit (LC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentTerms === 'lc' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lcBankName">LC Issuing Bank Name</Label>
                <Input id="lcBankName" value={lcBankName} onChange={(e) => setLcBankName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lcContactPerson">LC Bank Contact Person (Optional)</Label>
                <Input id="lcContactPerson" value={lcContactPerson} onChange={(e) => setLcContactPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lcContactEmail">LC Bank Contact Email (Optional)</Label>
                <Input id="lcContactEmail" type="email" value={lcContactEmail} onChange={(e) => setLcContactEmail(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentInstructions">Payment Instructions (for Customer)</Label>
            <Textarea id="paymentInstructions" value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} rows={3} placeholder="Add specific bank transfer details, deadlines, etc." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Internal / for Admin)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any internal notes about this invoice." />
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate & Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Admin Single Quote Page Component
export default function AdminSingleQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<IQuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests/${quoteId}`);
      if (response.data.success) {
        setQuote(response.data.data as IQuoteRequest);
      } else {
        throw new Error(response.data.message || "Failed to fetch quote request.");
      }
    } catch (err: any) {
      console.error("Error fetching quote:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load quote request.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const updateQuoteStatus = async (newStatus: QuoteRequestStatus, comments?: string, trackingNumber?: string, trackingLink?: string) => {
    if (!quote) return;
    setIsStatusUpdateLoading(true);
    // FIX: Define displayId for logs/toasts
    const displayId = quote.requestNumber || quoteId.substring(0, 8);
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests/${quoteId}`,
        {
          status: newStatus,
          adminComments: comments,
          trackingNumber: trackingNumber,
          trackingLink: trackingLink,
          dispatchedAt: newStatus === 'dispatched' ? new Date() : undefined,
        }
      );
      if (response.data.success) {
        setQuote(response.data.data as IQuoteRequest);
        toast.success(`Quote request ${displayId} status updated to ${newStatus}!`); // FIX: Use displayId
      } else {
        throw new Error(response.data.message || "Failed to update quote status.");
      }
    } catch (err: any) {
      console.error("Error updating quote status:", err.response?.data || err.message);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsStatusUpdateLoading(false);
    }
  };

  const handleDeleteQuote = async () => {
    if (!quote) return;
    if (!window.confirm("Are you sure you want to delete this quote request? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    // FIX: Define displayId for toast
    const displayId = quote.requestNumber || quoteId.substring(0, 8);
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests/${quoteId}`);
      if (response.data.success) {
        toast.success(`Quote request ${displayId} deleted successfully!`); // FIX: Use displayId
        router.push('/admin-ahmza/quotes');
      } else {
        throw new Error(response.data.message || "Failed to delete quote request.");
      }
    } catch (err: any) {
      console.error("Error deleting quote:", err.response?.data || err.message);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleInvoiceGenerated = (invoice: IInvoice) => {
    if (quote) {
      setQuote({ ...quote, invoiceId: invoice._id, status: 'approved' });
    }
    fetchQuote();
  };

  const getStatusBadge = (status: QuoteRequestStatus) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200"><Clock className="mr-1 h-3 w-3" /> Requested</Badge>;
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      case "paid":
        return <Badge className="bg-purple-600 hover:bg-purple-700"><DollarSign className="mr-1 h-3 w-3" /> Paid</Badge>;
      case "dispatched":
        return <Badge className="bg-indigo-600 hover:bg-indigo-700"><Truck className="mr-1 h-3 w-3" /> Dispatched</Badge>;
      case "cancelled":
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading quote details...</div>;
  }

  if (error || !quote) {
    return <div className="p-8 text-center text-red-500">{error || "Quote request not found."}</div>;
  }

  // FIX: Define pageDisplayId for page title and other places
  const pageDisplayId = quote.requestNumber || (quote._id as string).substring(0, 8);

  return (
    <div className="space-y-6 p-4">
      <Button variant="outline" onClick={() => router.push('/admin-ahmza/quotes')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quote List
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Quote Request: {pageDisplayId}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getStatusBadge(quote.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5" /> Customer Details</h3>
              <p><strong>Name:</strong> {quote.customerName}</p>
              <p><strong>Company:</strong> {quote.companyName}</p>
              <p className="flex items-center gap-1"><strong>Email:</strong> <Mail className="h-4 w-4" /> <a href={`mailto:${quote.customerEmail}`} className="text-blue-600 hover:underline">{quote.customerEmail}</a></p>
              {quote.customerPhone && <p className="flex items-center gap-1"><strong>Phone:</strong> <Phone className="h-4 w-4" /> {quote.customerPhone}</p>}
              <p className="flex items-center gap-1"><strong>Country:</strong> {quote.destinationCountry} <MapPin className="h-4 w-4" /></p>
            </div>

            {/* Item Details */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5" /> Item Details</h3>
              <p><strong>Item Name:</strong> {quote.itemName}</p>
              <p><strong>Item Type:</strong> {quote.itemTypeCategory}</p>
              <p><strong>Quantity:</strong> {quote.quantity} {quote.quantityUnit}</p>
              {quote.additionalComments && (
                <p><strong>Customer Comments:</strong> <Textarea value={quote.additionalComments} readOnly className="mt-1 resize-none h-20 bg-muted border-none" /></p>
              )}
            </div>
          </div>

          <Separator />

          {/* Admin Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Admin Actions & Status</h3>
            <div className="flex flex-wrap gap-3 items-end">
              {/* Status Update */}
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Label htmlFor="updateStatus">Update Status</Label>
                <Select value={quote.status} onValueChange={(val: QuoteRequestStatus) => updateQuoteStatus(val)}>
                  <SelectTrigger id="updateStatus">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Approve/Reject Buttons */}
              {quote.status === 'requested' && (
                <>
                  <Button onClick={() => updateQuoteStatus('approved', quote.adminComments)} disabled={isStatusUpdateLoading}>
                    {isStatusUpdateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Approve
                  </Button>
                  <Button variant="destructive" onClick={() => updateQuoteStatus('rejected', quote.adminComments)} disabled={isStatusUpdateLoading}>
                    {isStatusUpdateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject
                  </Button>
                </>
              )}

              {/* Generate Invoice Button (only if Approved and no invoice yet) */}
              {quote.status === 'approved' && !quote.invoiceId && (
                <Button onClick={() => setIsInvoiceFormOpen(true)} disabled={isStatusUpdateLoading}>
                  <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                </Button>
              )}

              {/* Mark as Dispatched (if Paid) */}
              {quote.status === 'paid' && (
                <Button onClick={() => updateQuoteStatus('dispatched', quote.adminComments, quote.trackingNumber, quote.trackingLink)} disabled={isStatusUpdateLoading}>
                  <Truck className="mr-2 h-4 w-4" /> Mark Dispatched
                </Button>
              )}
               {/* Mark as Paid (if Approved and has Invoice) */}
               {quote.status === 'approved' && quote.invoiceId && (
                <Button onClick={() => updateQuoteStatus('paid', quote.adminComments)} disabled={isStatusUpdateLoading}>
                  <DollarSign className="mr-2 h-4 w-4" /> Mark Paid
                </Button>
              )}

            </div>

            {/* Price / Payment Details (if quoted/approved) */}
            {(quote.proposedTotalPrice !== undefined && quote.proposedTotalPrice !== null) && (
              <div className="space-y-2">
                <h4 className="text-md font-semibold">Quote Pricing: <span className="text-green-600">${quote.proposedTotalPrice.toFixed(2)} USD</span></h4>
                <p><strong>Price per unit:</strong> ${quote.proposedPricePerUnit?.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> <Badge>{quote.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</Badge></p>
                {quote.paymentMethod === '100_advance_bank_transfer' || quote.paymentMethod === '30_70_split_bank_transfer' ? (
                  <>
                    {quote.paymentDetails?.accountTitle && <p><strong>Account Title:</strong> {quote.paymentDetails.accountTitle}</p>}
                    <p><strong>Bank:</strong> {quote.paymentDetails?.bankName}</p>
                    <p><strong>Account:</strong> {quote.paymentDetails?.accountNumber}</p>
                    {quote.paymentDetails?.swiftCode && <p><strong>SWIFT:</strong> {quote.paymentDetails.swiftCode}</p>}
                    {quote.paymentDetails?.iban && <p><strong>IBAN:</strong> {quote.paymentDetails.iban}</p>}
                    {quote.paymentDetails?.customTerms && <p><strong>Terms:</strong> {quote.paymentDetails.customTerms}</p>}
                  </>
                ) : quote.paymentMethod === 'letter_of_credit' ? (
                  <>
                    <p><strong>LC Bank:</strong> {quote.lcDetails?.bankName}</p>
                    {quote.lcDetails?.contactPerson && <p><strong>LC Contact:</strong> {quote.lcDetails.contactPerson}</p>}
                    {quote.lcDetails?.contactEmail && <p><strong>LC Email:</strong> {quote.lcDetails.contactEmail}</p>}
                    <p><strong>LC Status:</strong> <Badge>{quote.lcDetails?.lcStatus?.toUpperCase() || 'N/A'}</Badge></p>
                    <p><strong>Documents:</strong> {quote.lcDetails?.documentsUploaded ? <span className="text-green-600">Uploaded</span> : <span className="text-orange-600">Pending</span>}</p>
                    {/* Add document upload UI here */}
                  </>
                ) : null}
              </div>
            )}

            {/* Tracking Information (if Dispatched) */}
            {quote.status === 'dispatched' && quote.trackingLink && (
              <div className="space-y-2">
                <h4 className="text-md font-semibold flex items-center gap-2"><Truck className="h-5 w-5" /> Tracking Information</h4>
                <p><strong>Tracking Number:</strong> {quote.trackingNumber || 'N/A'}</p>
                <p><strong>Tracking Link:</strong> <a href={quote.trackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"> <LinkIcon className="h-4 w-4"/> {quote.trackingLink}</a></p>
                {quote.dispatchedAt && <p><strong>Dispatched On:</strong> {format(new Date(quote.dispatchedAt), 'MMM dd, yyyy HH:mm')}</p>}
              </div>
            )}


            {/* Admin Comments */}
            <div className="space-y-2">
              <Label htmlFor="adminComments">Admin Comments (Internal)</Label>
              <Textarea
                id="adminComments"
                value={quote.adminComments || ''}
                onChange={(e) => setQuote({ ...quote, adminComments: e.target.value })}
                rows={3}
                placeholder="Add internal comments about this quote..."
              />
              <Button onClick={() => updateQuoteStatus(quote.status, quote.adminComments)} disabled={isStatusUpdateLoading}>
                 Save Comments
              </Button>
            </div>

            <Separator />

            <Button variant="destructive" onClick={handleDeleteQuote} disabled={loading || isStatusUpdateLoading}>
              Delete Quote Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmations Section */}
      {quote && (
        <PaymentConfirmationsSection
          requestId={quoteId}
          requestType="quote"
        />
      )}

      {quote && (
        <InvoiceForm
          isOpen={isInvoiceFormOpen}
          onClose={() => setIsInvoiceFormOpen(false)}
          quote={quote}
          onInvoiceGenerated={handleInvoiceGenerated}
        />
      )}
    </div>
  );
}