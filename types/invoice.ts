// my-leather-platform/types/invoice.ts
import { Types } from 'mongoose';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';
export type PaymentTerms = '100_advance' | '30_70_split' | 'lc';

export interface IInvoiceItem {
  itemName: string;
  quantity: number;
  quantityUnit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface IInvoice {
  _id: string; // MongoDB ObjectId as string
  quoteRequestId: string; // Link back to the original quote request
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  
  // Customer Details
  customerName: string;
  customerEmail: string;
  companyName: string;
  customerAddress?: string; // Full address for invoice
  customerCountry?: string;

  // Vendor Details (Your Company) - can be pulled from settings or env
  vendorName: string;
  vendorAddress: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorBankDetails: {
    accountTitle?: string;
    bankName: string;
    accountNumber: string;
    swiftCode?: string;
    iban?: string;
  };

  // Invoice Items
  items: IInvoiceItem[];
  subtotal: number;
  taxRate?: number; // e.g., 0.05 for 5%
  taxAmount?: number;
  shippingCost?: number;
  totalAmount: number; // Final amount to be paid
  
  paymentTerms: PaymentTerms;
  paymentInstructions?: string;
  notes?: string; // Additional notes for the customer

  // LC specific details if applicable
  lcBankName?: string;
  lcContactPerson?: string;
  lcContactEmail?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}