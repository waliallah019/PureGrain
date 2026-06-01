// my-leather-platform\types\request.ts

import { ExpectedVolume } from '@/lib/models/sampleRequestModel';

export type SampleRequestItemType = 'raw-leather' | 'finished-products' | 'both';
export type Urgency = 'standard' | 'express' | 'rush';
export type BusinessType = 'wholesaler' | 'retailer' | 'manufacturer' | 'distributor' | 'designer' | 'other';
export type IntendedUse = 'production' | 'resale' | 'testing' | 'development' | 'other';
export type SampleRequestStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'refunded';

export interface ISampleRequest {
  _id: string;
  // FIX: Add a human-readable request number
  requestNumber: string; // New field
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  country: string;
  urgency?: Urgency;
  address: string;
  sampleType: SampleRequestItemType;
  quantitySamples?: string; // e.g., "1-3 samples"
  materialPreference?: string;
  finishType?: string;
  colorPreferences?: string; // Free text for specific colors
  specificRequests?: string; // Any other notes
  businessType?: BusinessType;
  intendedUse?: IntendedUse;
  futureVolume?: ExpectedVolume;
  productId?: string;
  productName?: string;
  productTypeCategory?: 'finished-product' | 'raw-leather';
  shippingFee: number;
  paymentStatus: SampleRequestStatus;
  wiseTransferId?: string;
  shippingTrackingLink?: string;
  shippedAt?: string;
  paymentConfirmationToken?: string;
  paymentConfirmationTokenExpiry?: string;
  paymentConfirmationSubmittedAt?: string;
  paymentConfirmationAmount?: number;
  paymentConfirmationMethod?: string;
  paymentConfirmationProofUrl?: string;
  paymentConfirmationStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export type { ExpectedVolume };
