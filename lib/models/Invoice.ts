// my-leather-platform/lib/models/Invoice.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IInvoice, IInvoiceItem } from '@/types/invoice'; // Import interfaces

// Mongoose schema for InvoiceItem (sub-document)
const InvoiceItemSchema: Schema = new Schema({
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  quantityUnit: { type: String, required: true, trim: true },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
}, { _id: false }); // Do not create _id for sub-documents by default

// Mongoose schema for Invoice
const InvoiceSchema: Schema = new Schema({
  quoteRequestId: { type: Schema.Types.ObjectId, ref: 'QuoteRequest', required: true, unique: true }, // Link back, unique
  invoiceNumber: { type: String, required: true, unique: true, trim: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },

  // Customer Details (Denormalized from QuoteRequest)
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  customerAddress: { type: String, trim: true },
  customerCountry: { type: String, trim: true },

  // Vendor Details (Your Company)
  vendorName: { type: String, required: true, trim: true },
  vendorAddress: { type: String, required: true, trim: true },
  vendorEmail: { type: String, required: true, trim: true },
  vendorPhone: { type: String, required: true, trim: true },
  vendorBankDetails: {
    accountTitle: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    swiftCode: { type: String, trim: true },
    iban: { type: String, trim: true },
  },

  // Invoice Items
  items: { type: [InvoiceItemSchema], required: true }, // Array of InvoiceItemSchema
  subtotal: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, min: 0, max: 1 }, // Stored as decimal (e.g., 0.05 for 5%)
  taxAmount: { type: Number, min: 0 },
  shippingCost: { type: Number, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },

  paymentTerms: { type: String, enum: ['100_advance', '30_70_split', 'lc'], required: true },
  paymentInstructions: { type: String, trim: true },
  notes: { type: String, trim: true },

  // LC specific details if applicable
  lcBankName: { type: String, trim: true },
  lcContactPerson: { type: String, trim: true },
  lcContactEmail: { type: String, trim: true },

}, {
  timestamps: true,
});

// Ensure model is not recompiled on hot-reloading in development
const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;