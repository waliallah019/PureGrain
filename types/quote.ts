// my-leather-platform/types/quote.ts
import { Types } from 'mongoose';

export type QuoteRequestStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'dispatched'
  | 'cancelled';

export type QuotePaymentMethod =
  | '100_advance_bank_transfer'
  | '30_70_split_bank_transfer'
  | 'letter_of_credit';

export type QuoteRequestItemType = 'finished-product' | 'raw-leather' | 'custom'; // Added 'custom'

export interface IQuoteRequest {
  _id: string; // MongoDB ObjectId as string
  // FIX: Add a human-readable request number
  requestNumber: string; // New field
  itemName: string; // Pre-filled product/leather name
  itemId?: string; // Made optional as 'custom' requests won't have an itemId
  itemTypeCategory: QuoteRequestItemType; // 'finished-product', 'raw-leather', or 'custom'

  // Customer Details
  customerName: string;
  customerEmail: string;
  companyName: string;
  customerPhone?: string; // Optional
  destinationCountry: string;

  // Request Details
  quantity: number; // Requested quantity
  quantityUnit: string; // e.g., 'units', 'sq ft'
  additionalComments?: string; // Customer's additional comments

  // Admin-managed Fields
  status: QuoteRequestStatus;
  adminComments?: string; // Comments from admin

  // Invoice & Payment Details (populated if approved)
  invoiceId?: string; // Link to generated Invoice
  proposedPricePerUnit?: number; // Price quoted by admin
  proposedTotalPrice?: number; // Total price quoted by admin
  paymentMethod?: QuotePaymentMethod;
  paymentDetails?: {
    accountTitle?: string;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
    customTerms?: string; // For 30/70 split or other custom arrangements
  };
  lcDetails?: {
    bankName: string;
    contactPerson?: string;
    contactEmail?: string;
    documentsUploaded?: boolean;
    documents?: string[]; // URLs to uploaded documents
    lcStatus?: 'initiated' | 'confirmed' | 'rejected' | 'completed'; // Make lcStatus optional
  };

  // Tracking
  trackingNumber?: string;
  trackingLink?: string;
  dispatchedAt?: Date;

  // Payment Confirmation
  paymentConfirmationToken?: string;
  paymentConfirmationTokenExpiry?: Date;
  paymentConfirmationSubmittedAt?: Date;
  paymentConfirmationAmount?: number;
  paymentConfirmationMethod?: string;
  paymentConfirmationProofUrl?: string;
  paymentConfirmationStatus?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}