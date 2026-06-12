// lib/models/sampleRequestModel.ts
import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'refunded';

interface PaymentError {
    code?: string;
    message?: string;
}

export type SampleRequestItemType = 'raw-leather' | 'finished-products' | 'both';
export type Urgency = 'standard' | 'express' | 'rush';
export type BusinessType = 'wholesaler' | 'retailer' | 'manufacturer' | 'distributor' | 'designer' | 'other';
export type IntendedUse = 'production' | 'resale' | 'testing' | 'development' | 'other';
export type ExpectedVolume = 'small' | 'medium' | 'large' | 'ongoing' | 'unsure';

// New (additive) types for the unified review flow.
// `requestType` distinguishes between the two flows:
//  - "HIDE":             1-3 leather hide samples (free, pay shipping only)
//  - "FINISHED_PRODUCT": exactly 1 finished product sample
export type SampleRequestType = 'HIDE' | 'FINISHED_PRODUCT';

export interface ISampleRequestItem {
  productId?: string;
  productName?: string;
  productType?: string;
  // Hide-only fields
  hideType?: string;
  grade?: string;
  thickness?: string;
  tanningMethod?: string;
  finish?: string;
  // Finished-product-only fields
  variantId?: string;
  variantName?: string;
}

export interface ISampleRequest extends Document {
  _id: string;
  // FIX: Add a human-readable request number
  requestNumber: string; // New field
  // New (additive) public-facing order reference (PGE-YYYY-XXXX).
  // Coexists with `requestNumber`; older records will not have this set.
  orderRef?: string;
  // New (additive) request-type discriminator and item array for the
  // unified review flow. Legacy single-product fields below stay.
  requestType?: SampleRequestType;
  items?: ISampleRequestItem[];
  estimatedDays?: string;
  industry?: string;
  website?: string;
  notes?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  country: string;
  urgency: Urgency;
  address: string;
  sampleType: SampleRequestItemType;
  quantitySamples?: string;
  materialPreference?: string;
  finishType?: string;
  colorPreferences?: string;
  specificRequests?: string;
  businessType?: BusinessType;
  intendedUse?: IntendedUse;
  futureVolume?: ExpectedVolume;
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  productTypeCategory?: 'finished-product' | 'raw-leather';
  shippingFee: number;
  paymentStatus: PaymentStatus;
  wiseTransferId?: string;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paypalCaptureStatus?: string;
  paypalPayerEmail?: string;
  paymentMethod?: 'paypal' | 'bank-transfer' | 'manual';
  paymentCompletedAt?: Date;
  paymentError?: PaymentError;
  paymentConfirmationToken?: string;
  paymentConfirmationTokenExpiry?: Date;
  paymentConfirmationSubmittedAt?: Date;
  paymentConfirmationAmount?: number;
  paymentConfirmationMethod?: string;
  paymentConfirmationProofUrl?: string;
  paymentConfirmationStatus?: string;
  shippedAt?: Date;
  shippingTrackingLink?: string;
  trackingNumber?: string;
  courierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sampleRequestItemSchema = new Schema<ISampleRequestItem>(
  {
    productId: { type: String, trim: true },
    productName: { type: String, trim: true },
    productType: { type: String, trim: true },
    hideType: { type: String, trim: true },
    grade: { type: String, trim: true },
    thickness: { type: String, trim: true },
    tanningMethod: { type: String, trim: true },
    finish: { type: String, trim: true },
    variantId: { type: String, trim: true },
    variantName: { type: String, trim: true },
  },
  { _id: false }
);

const sampleRequestSchema: Schema<ISampleRequest> = new Schema<ISampleRequest>({
  // FIX: Add requestNumber to schema
  requestNumber: { type: String, unique: true, required: true },
  orderRef: { type: String, trim: true },
  requestType: { type: String, enum: ['HIDE', 'FINISHED_PRODUCT'] },
  items: { type: [sampleRequestItemSchema], default: undefined },
  estimatedDays: { type: String, trim: true },
  industry: { type: String, trim: true },
  website: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 300 },
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  urgency: { type: String, enum: ['standard', 'express', 'rush'], default: 'standard' },
  address: { type: String, required: true, trim: true },
  sampleType: { type: String, enum: ['raw-leather', 'finished-products', 'both'], required: true },
  quantitySamples: { type: String, trim: true },
  materialPreference: { type: String, trim: true },
  finishType: { type: String, trim: true },
  colorPreferences: { type: String, trim: true },
  specificRequests: { type: String, trim: true },
  businessType: { type: String, enum: ['wholesaler', 'retailer', 'manufacturer', 'distributor', 'designer', 'other'], default: 'other' },
  intendedUse: { type: String, enum: ['production', 'resale', 'testing', 'development', 'other'], default: 'other' },
  futureVolume: { type: String, enum: ['small', 'medium', 'large', 'ongoing', 'unsure'], default: 'unsure' },
  productId: { type: Schema.Types.ObjectId, refPath: 'productTypeCategory' },
  productName: { type: String, trim: true },
  productTypeCategory: { type: String, enum: ['finished-product', 'raw-leather'] },
  shippingFee: { type: Number, required: true, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'],
    default: 'pending'
  },
  wiseTransferId: { type: String },
  paypalOrderId: { type: String, index: true },
  paypalTransactionId: { type: String, index: true },
  paypalCaptureStatus: { type: String },
  paypalPayerEmail: { type: String, lowercase: true, trim: true },
  paymentMethod: { type: String, enum: ['paypal', 'bank-transfer', 'manual'], default: 'bank-transfer' },
  paymentCompletedAt: { type: Date },
  paymentError: {
    code: { type: String },
    message: { type: String },
  },
  paymentConfirmationToken: { type: String },
  paymentConfirmationTokenExpiry: { type: Date },
  paymentConfirmationSubmittedAt: { type: Date },
  paymentConfirmationAmount: { type: Number },
  paymentConfirmationMethod: { type: String },
  paymentConfirmationProofUrl: { type: String },
  paymentConfirmationStatus: { type: String },
  shippedAt: { type: Date },
  shippingTrackingLink: { type: String, trim: true },
  trackingNumber: { type: String, trim: true },
  courierName: { type: String, trim: true },
}, { timestamps: true });

sampleRequestSchema.index({ wiseTransferId: 1 }, { unique: true, sparse: true });
sampleRequestSchema.index({ paypalOrderId: 1 }, { unique: true, sparse: true });
sampleRequestSchema.index({ paypalTransactionId: 1 }, { unique: true, sparse: true });
// FIX: Add index for requestNumber
sampleRequestSchema.index({ requestNumber: 1 }, { unique: true });
// New (additive) index for the public order reference. Sparse so legacy
// records without an orderRef do not collide.
sampleRequestSchema.index({ orderRef: 1 }, { unique: true, sparse: true });

const SampleRequest = mongoose.models.SampleRequest || mongoose.model<ISampleRequest>('SampleRequest', sampleRequestSchema);

export default SampleRequest;