// my-leather-platform/app/admin/custom-manufacturing/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ICustomManufacturingRequest } from "@/lib/models/CustomManufacturingRequest";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

// Shadcn UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // For email body
import { Input } from "@/components/ui/input"; // For email subject
import {
  Dialog, // Import Dialog components
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Ensure you have Dialog components
import { Separator } from "@/components/ui/separator";
import PaymentConfirmationsSection from "@/components/admin/PaymentConfirmationsSection";
import { PaymentTerms } from "@/types/invoice";

import {
  FileText,
  Download,
  Mail,
  Phone,
  ArrowLeft,
  Trash2,
  Send,
  Eye, // New: Eye icon for view in modal
  ExternalLink, // New: ExternalLink icon for open in new tab
  Image as ImageIcon, // New: Using Image icon for image files
  Loader2,
  DollarSign,
} from "lucide-react"; // Icons

interface CustomRequestDetailPageProps {
  params: { id: string };
}

const requestStatuses = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "invoice_sent",
  "payment_pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "expired",
];

const InvoiceForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  request: ICustomManufacturingRequest;
  onInvoiceGenerated: () => void;
}> = ({ isOpen, onClose, request, onInvoiceGenerated }) => {
  const [proposedPricePerUnit, setProposedPricePerUnit] = useState<number>(request.proposedPricePerUnit || 0);
  const [taxRate, setTaxRate] = useState<number>(request.taxRate || 0);
  const [shippingCost, setShippingCost] = useState<number>(request.shippingCost || 0);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    request.paymentMethod === '100_advance_bank_transfer'
      ? '100_advance'
      : request.paymentMethod === '30_70_split_bank_transfer'
        ? '30_70_split'
        : request.paymentMethod === 'letter_of_credit'
          ? 'lc'
          : '100_advance'
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(request.paymentDetails?.customTerms || '');
  const [notes, setNotes] = useState<string>(request.adminComments || '');
  const [lcBankName, setLcBankName] = useState<string>(request.lcDetails?.bankName || '');
  const [lcContactPerson, setLcContactPerson] = useState<string>(request.lcDetails?.contactPerson || '');
  const [lcContactEmail, setLcContactEmail] = useState<string>(request.lcDetails?.contactEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setProposedPricePerUnit(request.proposedPricePerUnit || 0);
    setTaxRate(request.taxRate || 0);
    setShippingCost(request.shippingCost || 0);
    setPaymentInstructions(request.paymentDetails?.customTerms || '');
    setNotes(request.adminComments || '');
    setLcBankName(request.lcDetails?.bankName || '');
    setLcContactPerson(request.lcDetails?.contactPerson || '');
    setLcContactEmail(request.lcDetails?.contactEmail || '');
  }, [isOpen, request]);

  const quantity = Number.parseFloat(request.estimatedQuantity || '0') || 1;
  const totalCalculatedPrice = quantity * proposedPricePerUnit + (quantity * proposedPricePerUnit * taxRate) + shippingCost;

  const handleSubmit = async () => {
    if (proposedPricePerUnit <= 0) {
      toast.error('Proposed price per unit must be greater than 0.');
      return;
    }
    if (paymentTerms === 'lc' && !lcBankName) {
      toast.error('LC bank name is required for Letter of Credit terms.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/custom-manufacturing/${request._id}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedPricePerUnit: Number(proposedPricePerUnit),
          taxRate: Number(taxRate),
          shippingCost: Number(shippingCost),
          paymentTerms,
          paymentInstructions,
          notes,
          lcBankName: paymentTerms === 'lc' ? lcBankName : undefined,
          lcContactPerson: paymentTerms === 'lc' ? lcContactPerson : undefined,
          lcContactEmail: paymentTerms === 'lc' ? lcContactEmail : undefined,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to generate invoice.');
      }

      toast.success('Invoice generated and sent successfully!');
      onInvoiceGenerated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice: {request.requestNumber || String(request._id).substring(0, 8)}</DialogTitle>
          <DialogDescription>
            Configure amount, payment terms, and send invoice with payment confirmation link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p><strong>Product:</strong> {request.productType} ({request.estimatedQuantity})</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposedPricePerUnit">Proposed Price Per Unit (USD)</Label>
              <Input id="proposedPricePerUnit" type="number" step="0.01" value={proposedPricePerUnit} onChange={(e) => setProposedPricePerUnit(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost (USD)</Label>
              <Input id="shippingCost" type="number" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input id="taxRate" type="number" step="0.01" value={taxRate * 100} onChange={(e) => setTaxRate(Number(e.target.value) / 100)} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input value={`$${totalCalculatedPrice.toFixed(2)} USD`} readOnly />
            </div>
          </div>

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
                <Label htmlFor="lcContactPerson">LC Contact Person</Label>
                <Input id="lcContactPerson" value={lcContactPerson} onChange={(e) => setLcContactPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lcContactEmail">LC Contact Email</Label>
                <Input id="lcContactEmail" type="email" value={lcContactEmail} onChange={(e) => setLcContactEmail(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentInstructions">Payment Instructions (Customer)</Label>
            <Textarea id="paymentInstructions" value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate & Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function CustomRequestDetailPage({
  params,
}: CustomRequestDetailPageProps) {
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState<ICustomManufacturingRequest | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  // Email reply states
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // New: Image modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  const fetchRequest = useCallback(async () => {
    if (!requestId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/custom-manufacturing/${requestId}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to fetch request with ID: ${requestId}`,
        );
      }
      const data = await response.json();
      if (data.data) {
        setRequest(data.data);
        // Pre-fill email subject for convenience
        setEmailSubject(
          `Re: Custom Manufacturing Inquiry - ${data.data.companyName} (${data.data.productType})`,
        );
      } else {
        // Explicitly set request to null if data.data is not found
        setRequest(null);
        throw new Error("Request data not found in response.");
      }
    } catch (err: any) {
      console.error("Error fetching request details:", err);
      setError(
        err.message ||
          "An unexpected error occurred while fetching request details.",
      );
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const updateRequestData = async (updatePayload: Record<string, unknown>, successMessage: string) => {
    if (!request || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/custom-manufacturing/${request._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message || "Failed to update request.");
      }

      setRequest(payload.data);
      toast.success(successMessage);
    } catch (err: any) {
      toast.error(err.message || "Failed to update request.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Check for request nullability at the beginning of the handler
    if (!request) {
      toast.error("Cannot update status: request data is missing.");
      return;
    }
    if (newStatus === request.status || isUpdatingStatus) return;

    await updateRequestData({ status: newStatus }, `Request status updated to ${newStatus}`);
  };

  const handleInvoiceGenerated = async () => {
    await fetchRequest();
  };

  const handleDelete = async () => {
    // Check for request nullability at the beginning of the handler
    if (!request) {
      toast.error("Cannot delete: request data is missing.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this request permanently?",
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/custom-manufacturing/${request._id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete request.");
      }
      toast.success("Request deleted successfully!");
      router.push("/admin-ahmza/custom-manufacturing"); // Redirect back to list
    } catch (err: any) {
      console.error("Error deleting request:", err);
      toast.error(`Error deleting request: ${err.message}`);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check for request nullability at the beginning of the handler
    if (!request) {
      toast.error("Cannot send email: request data is missing.");
      return;
    }
    if (!emailSubject || !emailBody || isSendingEmail) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: request.email,
          subject: emailSubject,
          body: emailBody,
          requestLink: `${window.location.origin}/admin/custom-manufacturing/${request._id}`, // Pass full URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send email.");
      }

      toast.success("Email sent successfully!");
      setEmailBody(""); // Clear message after sending
      // Optionally, you might update the request status to "Contacted" here
      // if (request.status === "Pending" || request.status === "Reviewed") {
      //   handleStatusChange("Contacted");
      // }
    } catch (err: any) {
      console.error("Error sending email:", err);
      toast.error(`Failed to send email: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // New: Handle opening the image modal
  const handleOpenImageModal = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageModalOpen(true);
  };

  // This helper function handles a null status more gracefully for styling
  const getStatusColorClass = (status: string | undefined) => {
    switch (status) {
      case "Pending":
      case "submitted":
      case "requested":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-300 dark:border-yellow-700";
      case "Reviewed":
      case "under_review":
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:border-blue-700";
      case "Contacted":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-800/20 dark:text-red-300 dark:border-red-700";
      case "invoice_sent":
      case "payment_pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-800/20 dark:text-amber-300 dark:border-amber-700";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-800/20 dark:text-green-300 dark:border-green-700";
      case "processing":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300 dark:border-indigo-700";
      case "dispatched":
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300 dark:border-indigo-700";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-800/20 dark:text-emerald-300 dark:border-emerald-700";
      case "cancelled":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-300 dark:border-orange-700";
      case "expired":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-700";
      case "Archived":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700"; // Fallback for undefined/null status
    }
  };

  // --- Start of render logic with checks ---
  // The crucial part is to ensure that all JSX that uses 'request' properties
  // is only rendered AFTER 'request' is confirmed to be non-null.

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 lg:p-8">
        <div className="text-center text-muted-foreground flex items-center space-x-2">
          <div className="w-5 h-5 bg-primary rounded-full animate-pulse"></div>
          <div
            className="w-5 h-5 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-5 h-5 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <span>Loading request details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 lg:p-8">
        <div className="text-center text-destructive mb-4">{error}</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // THIS IS THE MAIN GUARD CLAUSE:
  // If we reach this point and request is still null, it means data wasn't found.
  if (!request) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 lg:p-8">
        <div className="text-center text-muted-foreground mb-4">
          Request not found.
        </div>
        <Button onClick={() => router.push("/admin-ahmza/custom-manufacturing")}>
          View All Requests
        </Button>
      </div>
    );
  }

  // --- If we've passed all checks, 'request' is guaranteed to be ICustomManufacturingRequest
  //     so we can safely access its properties without optional chaining (?. )
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Request Details
          </h1>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Request
          </Button>
        </div>

        <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {request.companyName}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Submitted by {request.contactPerson} on{" "}
                {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
              </CardDescription>
            </div>
            <Badge
              className={`text-lg px-3 py-1 font-semibold ${getStatusColorClass(request.status)}`}
            >
              {request.status}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-8 p-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="block text-sm font-medium">Email</Label>
                    <a
                      href={`mailto:${request.email}`}
                      className="text-foreground text-base hover:underline font-medium"
                    >
                      {request.email}
                    </a>
                  </div>
                </div>
                {request.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="block text-sm font-medium">Phone</Label>
                      <a
                        href={`tel:${request.phone}`}
                        className="text-foreground text-base hover:underline font-medium"
                      >
                        {request.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Project Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Product Type
                  </Label>
                  <p className="text-foreground font-medium text-base">
                    {request.productType}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Estimated Quantity
                  </Label>
                  <p className="text-foreground font-medium text-base">
                    {request.estimatedQuantity}
                  </p>
                </div>
                {request.preferredMaterial && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Preferred Material
                    </Label>
                    <p className="text-foreground font-medium text-base">
                      {request.preferredMaterial}
                    </p>
                  </div>
                )}
                {request.colors && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Colors</Label>
                    <p className="text-foreground font-medium text-base">
                      {request.colors}
                    </p>
                  </div>
                )}
                {request.timeline && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Timeline</Label>
                    <p className="text-foreground font-medium text-base">
                      {request.timeline}
                    </p>
                  </div>
                )}
                {request.budgetRange && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Budget Range
                    </Label>
                    <p className="text-foreground font-medium text-base">
                      {request.budgetRange}
                    </p>
                  </div>
                )}
              </div>
              {request.specifications && (
                <div className="space-y-2 mt-4">
                  <Label className="text-sm text-muted-foreground">
                    Specifications
                  </Label>
                  <Card className="p-4 text-base bg-muted/50 whitespace-pre-wrap leading-relaxed text-foreground border-dashed">
                    {request.specifications}
                  </Card>
                </div>
              )}
            </div>

            {/* Design Files */}
            {request.designFiles && request.designFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                  Design Files ({request.designFiles.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {request.designFiles.map((fileUrl, index) => {
                    const fileName = fileUrl.substring(
                      fileUrl.lastIndexOf("/") + 1,
                    );
                    // Simple check for common image extensions
                    const isImage = /\.(jpeg|jpg|png|gif|webp|svg|bmp)$/i.test(
                      fileName,
                    );

                    return (
                      <Card
                        key={index}
                        className="flex items-center p-3 gap-3 border bg-secondary/30 text-secondary-foreground"
                      >
                        {/* Display an image icon or a generic file icon */}
                        {isImage ? (
                          <ImageIcon className="h-6 w-6 text-muted-foreground shrink-0" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                        )}
                        <span className="flex-1 text-sm truncate">
                          {fileName}
                        </span>
                        <div className="flex items-center gap-1">
                          {isImage && (
                            // Button to view image in a modal
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 hover:bg-secondary/50"
                              onClick={() => handleOpenImageModal(fileUrl)}
                              aria-label="View image preview"
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {/* Button to open file in a new tab */}
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open file in new tab"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 hover:bg-secondary/50"
                            >
                              <ExternalLink className="h-4 w-4 text-green-500" />
                            </Button>
                          </a>
                          {/* Button to download the file */}
                          <a
                            href={fileUrl}
                            download // This attribute prompts the browser to download
                            target="_blank" // Still good to open in new tab in case download doesn't trigger
                            rel="noopener noreferrer"
                            aria-label="Download file"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 hover:bg-secondary/50"
                            >
                              <Download className="h-4 w-4 text-primary" />
                            </Button>
                          </a>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Admin Actions & Status
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-update" className="shrink-0">
                    Update Status:
                  </Label>
                  <Select
                    value={request.status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {requestStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isUpdatingStatus && (
                  <span className="text-sm text-muted-foreground">
                    Updating...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-end">
                {!request.invoiceNumber && (
                  <Button onClick={() => setIsInvoiceFormOpen(true)} disabled={isUpdatingStatus}>
                    <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                  </Button>
                )}

                {request.invoiceNumber && request.paymentStatus !== 'paid' && (
                  <Button
                    onClick={() =>
                      updateRequestData(
                        { paymentStatus: 'paid', status: 'Completed' },
                        'Payment marked as paid.'
                      )
                    }
                    disabled={isUpdatingStatus}
                  >
                    <DollarSign className="mr-2 h-4 w-4" /> Mark Paid
                  </Button>
                )}
              </div>

              {request.invoiceNumber && (
                <div className="space-y-2 rounded-md border p-4 bg-muted/20">
                  <h4 className="font-semibold">Invoice Details</h4>
                  <p><strong>Invoice Number:</strong> {request.invoiceNumber}</p>
                  <p><strong>Total Amount:</strong> ${Number(request.proposedTotalPrice || 0).toFixed(2)} USD</p>
                  <p><strong>Payment Method:</strong> {request.paymentMethod ? request.paymentMethod.replace(/_/g, ' ').toUpperCase() : 'N/A'}</p>
                  <p><strong>Payment Status:</strong> {request.paymentStatus || 'unpaid'}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminComments">Admin Comments (Internal)</Label>
                <Textarea
                  id="adminComments"
                  value={request.adminComments || ''}
                  onChange={(e) =>
                    setRequest((prev) =>
                      prev ? ({ ...prev, adminComments: e.target.value } as ICustomManufacturingRequest) : prev
                    )
                  }
                  rows={3}
                  placeholder="Add internal comments for this request..."
                />
                <Button
                  onClick={() =>
                    updateRequestData(
                      { adminComments: request.adminComments || '' },
                      'Admin comments saved.'
                    )
                  }
                  disabled={isUpdatingStatus}
                >
                  Save Comments
                </Button>
              </div>
            </div>

            <Separator />

            {/* Email Reply Section */}
            <form onSubmit={handleSendEmail} className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Reply via Email
              </h3>
              <div className="space-y-2">
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  value={request.email}
                  readOnly
                  className="bg-muted/50 text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  required
                />
              </div>
              <Button type="submit" disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 rounded-full border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PaymentConfirmationsSection
          requestId={String(request._id)}
          requestType="custom"
        />

        <InvoiceForm
          isOpen={isInvoiceFormOpen}
          onClose={() => setIsInvoiceFormOpen(false)}
          request={request}
          onInvoiceGenerated={handleInvoiceGenerated}
        />

        {/* Image Viewer Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-xl">Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative flex items-center justify-center p-4">
              {currentImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImageSrc}
                  alt="Design preview"
                  className="max-h-[80vh] w-auto object-contain rounded-md"
                />
              ) : (
                <p className="text-muted-foreground">No image to display.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}