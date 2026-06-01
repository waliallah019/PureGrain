// my-leather-platform/lib/models/QuoteRequest.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IQuoteRequest } from '@/types/quote'; // Import your interface

// Mongoose schema for QuoteRequest
const QuoteRequestSchema: Schema = new Schema({
  // FIX: Add a human-readable request number
  requestNumber: { type: String, unique: true, required: true },
  // Customer-provided / Pre-filled Item Details
  itemName: { type: String, required: true, trim: true },
  itemId: { type: String, trim: true }, // Make itemId optional
  itemTypeCategory: { type: String, enum: ['finished-product', 'raw-leather', 'custom'], required: true }, // Add 'custom'

  // Customer Details
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  companyName: { type: String, required: true, trim: true },
  customerPhone: { type: String, trim: true },
  destinationCountry: { type: String, required: true, trim: true },

  // Request Details
  quantity: { type: Number, required: true, min: 1 },
  quantityUnit: { type: String, required: true, trim: true }, // e.g., 'units', 'sq ft'
  additionalComments: { type: String, trim: true },

  // Admin-managed Fields
  status: { type: String, enum: ['requested', 'approved', 'rejected', 'paid', 'dispatched', 'cancelled'], default: 'requested' },
  adminComments: { type: String, trim: true },

  // Invoice & Payment Details (populated if approved)
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', sparse: true }, // Reference to Invoice model
  proposedPricePerUnit: { type: Number, min: 0 },
  proposedTotalPrice: { type: Number, min: 0 },
  paymentMethod: { type: String, enum: ['100_advance_bank_transfer', '30_70_split_bank_transfer', 'letter_of_credit'] },
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
    documents: [{ type: String, trim: true }],
    lcStatus: { type: String, enum: ['initiated', 'confirmed', 'rejected', 'completed'] },
  },

  // Tracking
  trackingNumber: { type: String, trim: true },
  trackingLink: { type: String, trim: true },
  dispatchedAt: { type: Date },

  // Payment Confirmation
  paymentConfirmationToken: { type: String },
  paymentConfirmationTokenExpiry: { type: Date },
  paymentConfirmationSubmittedAt: { type: Date },
  paymentConfirmationAmount: { type: Number },
  paymentConfirmationMethod: { type: String },
  paymentConfirmationProofUrl: { type: String },
  paymentConfirmationStatus: { type: String },

}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// FIX: Add unique index for requestNumber
QuoteRequestSchema.index({ requestNumber: 1 }, { unique: true });

// Ensure model is not recompiled on hot-reloading in development
const QuoteRequest = mongoose.models.QuoteRequest || mongoose.model<IQuoteRequest>('QuoteRequest', QuoteRequestSchema);

export default QuoteRequest;