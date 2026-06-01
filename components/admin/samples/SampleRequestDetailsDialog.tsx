// C:\Dev\puretemp-main\components\admin\samples\SampleRequestActionsDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ISampleRequest, PaymentStatus } from '@/lib/models/sampleRequestModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SampleRequestActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ISampleRequest;
  onUpdateStatus: (newStatus: PaymentStatus, trackingLink?: string) => Promise<void>;
  onDeleteSuccess: () => void;
  isLoading: boolean;
}

const SampleRequestActionsDialog: React.FC<SampleRequestActionsDialogProps> = ({
  isOpen, onClose, request, onUpdateStatus, onDeleteSuccess, isLoading
}) => {
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>(request.paymentStatus);
  const [trackingLink, setTrackingLink] = useState<string>(request.shippingTrackingLink || '');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(request.paymentStatus);
      setTrackingLink(request.shippingTrackingLink || '');
    }
  }, [isOpen, request]);

  // FIX: Define displayId for dialog title/toasts
  const dialogDisplayId = request.requestNumber || request._id.substring(0, 8) + '...';

  const handleUpdate = async () => {
    setLocalLoading(true);
    try {
      if (currentStatus === 'shipped' && !trackingLink.trim()) {
        toast.error("Tracking link is required when status is 'Shipped'.");
        setLocalLoading(false);
        return;
      }
      await onUpdateStatus(currentStatus, trackingLink);
    } catch (error) {
      console.error("[Dialog] Error updating status from dialog:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setCurrentStatus(value as PaymentStatus);
    if (value === 'shipped' && !trackingLink) {
      toast("Remember to add a tracking link for 'Shipped' status.", {
        icon: 'ℹ️',
        style: {
          background: '#e0f2fe',
          color: '#0369a1',
        },
      });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Sample Request: {dialogDisplayId}</DialogTitle> {/* FIX: Use dialogDisplayId */}
          <DialogDescription>
            Update status and shipping details for this sample request.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p><strong>Customer:</strong> {request.contactPerson} ({request.companyName})</p>
          <p><strong>Item:</strong> {request.productName || request.sampleType}</p>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="status">Update Status</Label>
            <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isLoading || localLoading}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select new status" />
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

          <div className="space-y-2">
            <Label htmlFor="trackingLink">Shipping Tracking Link</Label>
            <Input
              id="trackingLink"
              placeholder="e.g., https://track.example.com/12345"
              value={trackingLink}
              onChange={(e) => setTrackingLink(e.target.value)}
              disabled={isLoading || localLoading}
            />
            {(currentStatus === 'shipped' && !trackingLink.trim()) && (
              <p className="text-red-500 text-sm">Tracking link is recommended for 'Shipped' status.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading || localLoading}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={isLoading || localLoading}>
            {(isLoading || localLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SampleRequestActionsDialog;