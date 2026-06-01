// C:\Dev\puretemp-main\app\admin\samples\[id]\page.tsx
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

import { ISampleRequest, PaymentStatus } from '@/lib/models/sampleRequestModel';
import SampleRequestActionsDialog from '../../../../components/admin/samples/SampleRequestDetailsDialog';
import PaymentConfirmationsSection from '@/components/admin/PaymentConfirmationsSection';

export default function AdminSingleSamplePage() {
  const params = useParams();
  const router = useRouter();
  const sampleRequestId = params.id as string;

  const [sampleRequest, setSampleRequest] = useState<ISampleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false);

  const fetchSampleRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/sample-requests/${sampleRequestId}`);
      if (response.data.success) {
        setSampleRequest(response.data.data as ISampleRequest);
      } else {
        throw new Error(response.data.message || "Failed to fetch sample request.");
      }
    } catch (err: any) {
      console.error("[FE-Detail] Error fetching sample request:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load sample request.");
      setSampleRequest(null);
    } finally {
      setLoading(false);
    }
  }, [sampleRequestId]);

  useEffect(() => {
    fetchSampleRequest();
  }, [fetchSampleRequest]);

  const updateRequestStatus = async (
    newStatus: PaymentStatus,
    trackingLink?: string
  ) => {
    setIsStatusUpdateLoading(true);
    // FIX: Use requestNumber in logs/toasts
    const displayId = sampleRequest?.requestNumber || sampleRequestId.substring(0, 8);
    console.log(`[FE-Detail] Attempting to update request ${displayId} to status ${newStatus} with tracking ${trackingLink}`);
    try {
      if (!sampleRequestId || !/^[0-9a-fA-F]{24}$/.test(sampleRequestId)) {
        toast.error("Invalid Request ID provided for update (frontend check).");
        console.error("[FE-Detail] Invalid Request ID:", sampleRequestId);
        setIsStatusUpdateLoading(false);
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/sample-requests/${sampleRequestId}`;
      const payload = {
        status: newStatus,
        shippingTrackingLink: trackingLink === '' ? undefined : trackingLink,
      };
      console.log("[FE-Detail] Sending PATCH request to:", apiUrl, "with payload:", payload);

      const response = await axios.patch(apiUrl, payload);

      if (response.data.success) {
        toast.success(`Request ${displayId} status updated to ${newStatus}!`); // FIX: Use displayId
        console.log(`[FE-Detail] Update successful for request ${displayId}.`);
        setSampleRequest(response.data.data as ISampleRequest);
        setIsActionsDialogOpen(false);
      } else {
        console.error("[FE-Detail] API reported success: false but status 200:", response.data.message);
        throw new Error(response.data.message || "Failed to update request status (API reported failure).");
      }
    } catch (err: any) {
      console.error("[FE-Detail] Error during updateRequestStatus:", err);

      if (axios.isAxiosError(err) && err.response) {
        console.error("[FE-Detail] Axios error details:", err.response.status, err.response.data);
        const apiErrorMessage = err.response.data?.message || err.message;
        const validationErrors = err.response.data?.errors;

        toast.error(`Error: ${apiErrorMessage}`);

        if (validationErrors && Array.isArray(validationErrors)) {
          validationErrors.forEach((e: any) => {
            toast.error(`- ${e.path}: ${e.message}`);
          });
        }
      } else {
        toast.error(`Error: ${err.message || 'An unknown error occurred.'}`);
      }
    } finally {
      setIsStatusUpdateLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!sampleRequest) return;
    if (!window.confirm("Are you sure you want to delete this sample request? This action cannot be undone.")) {
      return;
    }
    setIsStatusUpdateLoading(true);
    const displayId = sampleRequest.requestNumber || sampleRequestId.substring(0, 8); // FIX: Use displayId
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/sample-requests/${sampleRequestId}`);
      if (response.data.success) {
        toast.success(`Sample request ${displayId} deleted successfully!`); // FIX: Use displayId
        router.push('/admin-ahmza/samples');
      } else {
        throw new Error(response.data.message || "Failed to delete sample request.");
      }
    } catch (err: any) {
      console.error("[FE-Detail] Error deleting sample request:", err.response?.data || err.message);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsStatusUpdateLoading(false);
    }
  };


  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200"><Clock className="mr-1 h-3 w-3" /> Pending Payment</Badge>;
      case "paid":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white"><Package className="mr-1 h-3 w-3" /> Processing</Badge>;
      case "shipped":
        return <Badge className="bg-green-600 hover:bg-green-700"><Truck className="mr-1 h-3 w-3" /> Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-indigo-600 hover:bg-indigo-700"><CheckCircle className="mr-1 h-3 w-3" /> Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>;
      case "failed":
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      case "refunded":
        return <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200"><XCircle className="mr-1 h-3 w-3" /> Refunded</Badge>;
      default:
        return <Badge variant="outline">{(status as string).charAt(0).toUpperCase() + (status as string).slice(1)}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading sample request details...</div>;
  }

  if (error || !sampleRequest) {
    return <div className="p-8 text-center text-red-500">{error || "Sample request not found."}</div>;
  }

  // FIX: Define displayId for the page title and other places
  const pageDisplayId = sampleRequest.requestNumber || sampleRequest._id.substring(0, 8);

  return (
    <div className="space-y-6 p-4">
      <Button variant="outline" onClick={() => router.push('/admin-ahmza/samples')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sample List
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Sample Request: {pageDisplayId}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getStatusBadge(sampleRequest.paymentStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5" /> Customer Details</h3>
              <p><strong>Name:</strong> {sampleRequest.contactPerson}</p>
              <p><strong>Company:</strong> {sampleRequest.companyName}</p>
              <p className="flex items-center gap-1"><strong>Email:</strong> <Mail className="h-4 w-4" /> <a href={`mailto:${sampleRequest.email}`} className="text-blue-600 hover:underline">{sampleRequest.email}</a></p>
              {sampleRequest.phone && <p className="flex items-center gap-1"><strong>Phone:</strong> <Phone className="h-4 w-4" /> {sampleRequest.phone}</p>}
              <p className="flex items-center gap-1"><strong>Country:</strong> {sampleRequest.country} <MapPin className="h-4 w-4" /></p>
              <p><strong>Address:</strong> {sampleRequest.address}</p>
              <p><strong>Urgency:</strong> <Badge variant="secondary">{sampleRequest.urgency}</Badge></p>
            </div>

            {/* Sample Details */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5" /> Sample Details</h3>
              <p><strong>Sample Type:</strong> {sampleRequest.sampleType}</p>
              {sampleRequest.productName && <p><strong>Product Name:</strong> {sampleRequest.productName}</p>}
              {sampleRequest.productTypeCategory && <p><strong>Product Category:</strong> {sampleRequest.productTypeCategory}</p>}
              {sampleRequest.quantitySamples && <p><strong>Quantity:</strong> {sampleRequest.quantitySamples}</p>}
              {sampleRequest.materialPreference && <p><strong>Material:</strong> {sampleRequest.materialPreference}</p>}
              {sampleRequest.finishType && <p><strong>Finish:</strong> {sampleRequest.finishType}</p>}
              {sampleRequest.colorPreferences && <p><strong>Colors:</strong> {sampleRequest.colorPreferences}</p>}
              {sampleRequest.specificRequests && (
                <p><strong>Specific Requests:</strong> <Textarea value={sampleRequest.specificRequests} readOnly className="mt-1 resize-none h-20 bg-muted border-none" /></p>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment & Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Payment Details</h3>
              <p><strong>Shipping Fee:</strong> ${sampleRequest.shippingFee.toFixed(2)} USD</p>
              <p><strong>Payment Status:</strong> {getStatusBadge(sampleRequest.paymentStatus)}</p>
              {sampleRequest.wiseTransferId && <p><strong>Wise Transfer ID:</strong> <span className="text-xs text-muted-foreground">{sampleRequest.wiseTransferId}</span></p>}
              {sampleRequest.paymentError && (
                <p className="text-red-500"><strong>Payment Error:</strong> {sampleRequest.paymentError.message} (Code: {sampleRequest.paymentError.code})</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Truck className="h-5 w-5" /> Shipping Details</h3>
              {sampleRequest.shippingTrackingLink && (
                <p><strong>Tracking Link:</strong> <a href={sampleRequest.shippingTrackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"> <LinkIcon className="h-4 w-4"/> {sampleRequest.shippingTrackingLink}</a></p>
              )}
              {sampleRequest.shippedAt && <p><strong>Shipped On:</strong> {format(new Date(sampleRequest.shippedAt), 'MMM dd, yyyy HH:mm')}</p>}
              {sampleRequest.paymentStatus === 'delivered' && <p className="text-green-600 font-medium">Delivered!</p>}
            </div>
          </div>

          <Separator />

          {/* Admin Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Admin Actions</h3>
            <div className="flex flex-wrap gap-3 items-end">
              {/* Status Update Select (Direct) */}
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Label htmlFor="updateStatus">Update Status</Label>
                <Select
                  value={sampleRequest.paymentStatus}
                  onValueChange={(val: PaymentStatus) => updateRequestStatus(val, sampleRequest.shippingTrackingLink)}
                  disabled={isStatusUpdateLoading}
                >
                  <SelectTrigger id="updateStatus">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Open Actions Dialog Button */}
              <Button onClick={() => setIsActionsDialogOpen(true)} disabled={isStatusUpdateLoading}>
                <Truck className="mr-2 h-4 w-4" /> Manage Shipment / Actions
              </Button>
            </div>

            <Separator />

            <Button variant="destructive" onClick={handleDeleteRequest} disabled={isStatusUpdateLoading}>
              Delete Sample Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmations Section */}
      {sampleRequest && (
        <PaymentConfirmationsSection
          requestId={sampleRequestId}
          requestType="sample"
        />
      )}

      {sampleRequest && (
        <SampleRequestActionsDialog
          isOpen={isActionsDialogOpen}
          onClose={() => setIsActionsDialogOpen(false)}
          request={sampleRequest}
          onUpdateStatus={updateRequestStatus}
          onDeleteSuccess={() => { router.push('/admin-ahmza/samples'); toast.success(`Sample request ${pageDisplayId} deleted!`); }} // FIX: Use pageDisplayId
          isLoading={isStatusUpdateLoading}
        />
      )}
    </div>
  );
}