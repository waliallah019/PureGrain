// components/admin/PaymentConfirmationsSection.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, FileText, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLenis } from '@/lib/utils/lenis';

interface PaymentConfirmation {
  id: string;
  requestNumber: string;
  requestType: 'sample' | 'quote' | 'custom';
  amount: number;
  paymentMethod: string;
  submittedAt: string;
  status: string;
  proofUrl: string;
}

interface PaymentConfirmationsSectionProps {
  requestId: string;
  requestType: 'sample' | 'quote' | 'custom';
}

export default function PaymentConfirmationsSection({
  requestId,
  requestType,
}: PaymentConfirmationsSectionProps) {
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<PaymentConfirmation | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const lenis = useLenis();
  const wasLenisStoppedRef = useRef(false);

  const fetchConfirmations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/payment-confirmations`,
        {
          params: {
            request_id: requestId,
            request_type: requestType,
          },
        }
      );

      if (response.data.success) {
        setConfirmations(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching payment confirmations:', err);
      setError(err.response?.data?.message || 'Failed to load payment confirmations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmations();
  }, [requestId, requestType]);

  useEffect(() => {
    if (!isProofModalOpen) return;

    const { body, documentElement } = document;
    const scrollY = window.scrollY;

    const originalBodyOverflow = body.style.overflow;
    const originalBodyPosition = body.style.position;
    const originalBodyTop = body.style.top;
    const originalBodyWidth = body.style.width;
    const originalHtmlOverflow = documentElement.style.overflow;

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      documentElement.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      body.style.position = originalBodyPosition;
      body.style.top = originalBodyTop;
      body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isProofModalOpen]);

  useEffect(() => {
    if (!lenis) return;

    if (isProofModalOpen) {
      wasLenisStoppedRef.current = lenis.isStopped;
      lenis.stop();
      return;
    }

    if (!wasLenisStoppedRef.current) {
      lenis.start();
    }
  }, [isProofModalOpen, lenis]);

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!selectedProof) return;

    setIsUpdating(true);
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/admin/payment-confirmations`,
        {
          requestId,
          requestType,
          status,
        }
      );

      if (response.data.success) {
        toast.success(`Payment confirmation ${status} successfully!`);
        setIsProofModalOpen(false);
        setSelectedProof(null);
        fetchConfirmations(); // Refresh data
      }
    } catch (err: any) {
      console.error('Error updating payment confirmation:', err);
      toast.error(err.response?.data?.message || 'Failed to update payment confirmation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewProof = (confirmation: PaymentConfirmation) => {
    setSelectedProof(confirmation);
    setIsProofModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending_review':
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPdfFile = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment Confirmations
          </CardTitle>
          <CardDescription>View and manage payment confirmations for this request</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment Confirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment Confirmations
          </CardTitle>
          <CardDescription>View and manage payment confirmations for this request</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmations.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Confirmations</AlertTitle>
              <AlertDescription>
                No payment confirmations have been submitted for this request yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confirmation ID</TableHead>
                    <TableHead>Amount (USD)</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proof File</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmations.map((confirmation) => (
                    <TableRow key={confirmation.id}>
                      <TableCell className="font-mono text-sm">
                        {confirmation.requestNumber || confirmation.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${confirmation.amount?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{confirmation.paymentMethod}</TableCell>
                      <TableCell>
                        {confirmation.submittedAt
                          ? format(new Date(confirmation.submittedAt), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(confirmation.status)}</TableCell>
                      <TableCell>
                        {confirmation.proofUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProof(confirmation)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Proof
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No file</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {confirmation.status === 'pending_review' ? (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedProof(confirmation);
                                handleStatusUpdate('approved');
                              }}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedProof(confirmation);
                                handleStatusUpdate('rejected');
                              }}
                              disabled={isUpdating}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {confirmation.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof View Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain"
          data-lenis-prevent
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Review the payment proof submitted by the customer
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4">
              {/* Confirmation Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">${selectedProof.amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{selectedProof.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="font-semibold">
                    {selectedProof.submittedAt
                      ? format(new Date(selectedProof.submittedAt), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedProof.status)}</div>
                </div>
              </div>

              {/* Proof File Preview */}
              {selectedProof.proofUrl && (
                <div className="border rounded-lg p-4">
                  {isImageFile(selectedProof.proofUrl) ? (
                    <div className="relative w-full h-[500px]">
                      <Image
                        src={selectedProof.proofUrl}
                        alt="Payment proof"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : isPdfFile(selectedProof.proofUrl) ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-5 h-5" />
                        <span>PDF Document</span>
                      </div>
                      <iframe
                        src={selectedProof.proofUrl}
                        className="w-full h-[500px] border rounded"
                        title="Payment proof PDF"
                      />
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedProof.proofUrl, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">
                        File preview not available
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedProof.proofUrl, '_blank')}
                      >
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedProof?.status === 'pending_review' && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve Payment
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject Payment
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => setIsProofModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
