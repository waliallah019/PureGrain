// my-leather-platform/lib/models/CustomManufacturingRequest.ts
import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICustomManufacturingRequest extends Document {
  requestNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string; // Optional
  productType: string;
  estimatedQuantity: string; // Storing as string as per your input field example
  preferredMaterial?: string; // Optional
  colors?: string; // Storing as string as per your input field example
  timeline?: string; // Optional
  designFiles: string[]; // Array of Cloudinary URLs
  specifications?: string; // Optional
  budgetRange?: string; // Optional
  status: "submitted" | "under_review" | "approved" | "rejected" | "invoice_sent" | "payment_pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "expired" | "requested" | "Pending" | "Reviewed" | "Contacted" | "Completed" | "Archived"; // Admin-facing status
  adminComments?: string;

  // Invoice & payment workflow fields
  invoiceNumber?: string;
  proposedPricePerUnit?: number;
  proposedTotalPrice?: number;
  taxRate?: number;
  shippingCost?: number;
  paymentMethod?: "100_advance_bank_transfer" | "30_70_split_bank_transfer" | "letter_of_credit";
  paymentDetails?: {
    accountTitle?: string;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
    customTerms?: string;
  };
  lcDetails?: {
    bankName?: string;
    contactPerson?: string;
    contactEmail?: string;
    documentsUploaded?: boolean;
    lcStatus?: "initiated" | "confirmed" | "rejected" | "completed";
  };
  paymentStatus?: "unpaid" | "processing" | "paid" | "rejected";

  // Payment confirmation fields
  paymentConfirmationToken?: string;
  paymentConfirmationTokenExpiry?: Date;
  paymentConfirmationSubmittedAt?: Date;
  paymentConfirmationAmount?: number;
  paymentConfirmationMethod?: string;
  paymentConfirmationProofUrl?: string;
  paymentConfirmationStatus?: string;

  // Dispatch tracking
  trackingNumber?: string;
  trackingLink?: string;
  dispatchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomManufacturingRequestSchema: Schema = new Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: () => `CMR-${Date.now()}-${Math.floor(Math.random() * 90000) + 10000}`,
    },
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    productType: { type: String, required: true, trim: true },
    estimatedQuantity: { type: String, required: true, trim: true },
    preferredMaterial: { type: String, trim: true },
    colors: { type: String, trim: true },
    timeline: { type: String, trim: true },
    designFiles: { type: [String], default: [] }, // Cloudinary URLs
    specifications: { type: String, trim: true },
    budgetRange: { type: String, trim: true },
    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected", "invoice_sent", "payment_pending", "paid", "processing", "shipped", "delivered", "cancelled", "expired", "requested", "Pending", "Reviewed", "Contacted", "Completed", "Archived"],
      default: "submitted",
    },
    adminComments: { type: String, trim: true },

    // Invoice and payment data
    invoiceNumber: { type: String, trim: true },
    proposedPricePerUnit: { type: Number, min: 0 },
    proposedTotalPrice: { type: Number, min: 0 },
    taxRate: { type: Number, min: 0, max: 1 },
    shippingCost: { type: Number, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["100_advance_bank_transfer", "30_70_split_bank_transfer", "letter_of_credit"],
    },
    paymentDetails: {
      accountTitle: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      swiftCode: { type: String, trim: true },
      iban: { type: String, trim: true },
      customTerms: { type: String, trim: true },
    },
    lcDetails: {
      bankName: { type: String, trim: true },
      contactPerson: { type: String, trim: true },
      contactEmail: { type: String, trim: true },
      documentsUploaded: { type: Boolean, default: false },
      lcStatus: {
        type: String,
        enum: ["initiated", "confirmed", "rejected", "completed"],
      },
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "paid", "rejected"],
      default: "unpaid",
    },

    // Payment confirmation details
    paymentConfirmationToken: { type: String },
    paymentConfirmationTokenExpiry: { type: Date },
    paymentConfirmationSubmittedAt: { type: Date },
    paymentConfirmationAmount: { type: Number },
    paymentConfirmationMethod: { type: String },
    paymentConfirmationProofUrl: { type: String },
    paymentConfirmationStatus: { type: String },

    // Dispatch tracking
    trackingNumber: { type: String, trim: true },
    trackingLink: { type: String, trim: true },
    dispatchedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

CustomManufacturingRequestSchema.index({ email: 1, status: 1, createdAt: -1 }); // Indexes for efficient lookup
CustomManufacturingRequestSchema.index({ requestNumber: 1 }, { unique: true, sparse: true });

const CustomManufacturingRequest: Model<ICustomManufacturingRequest> =
  (mongoose.models.CustomManufacturingRequest as Model<ICustomManufacturingRequest>) ||
  mongoose.model<ICustomManufacturingRequest>("CustomManufacturingRequest", CustomManufacturingRequestSchema);

export default CustomManufacturingRequest;