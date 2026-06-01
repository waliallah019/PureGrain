// my-leather-platform/lib/services/invoiceService.ts
import Invoice from '@/lib/models/Invoice';
import { IInvoice } from '@/types/invoice'; // Named import for interface
import QuoteRequest from '@/lib/models/QuoteRequest';
import { IQuoteRequest } from '@/types/quote';
import logger from '@/lib/config/logger';
import mongoose from 'mongoose';

interface GenerateInvoiceOptions {
  quoteRequestId: string;
  proposedPricePerUnit: number;
  paymentTerms: IInvoice['paymentTerms'];
  taxRate?: number; // e.g., 0.05 for 5%
  shippingCost?: number;
  paymentInstructions?: string;
  notes?: string;
  // For LC:
  lcBankName?: string;
  lcContactPerson?: string;
  lcContactEmail?: string;
}

class InvoiceService {
  /**
   * Generates and saves an invoice based on an approved quote request.
   */
  public async generateInvoice(options: GenerateInvoiceOptions): Promise<IInvoice> {
    const { quoteRequestId, proposedPricePerUnit, paymentTerms, taxRate, shippingCost, paymentInstructions, notes, lcBankName, lcContactPerson, lcContactEmail } = options;

    if (!mongoose.Types.ObjectId.isValid(quoteRequestId)) {
      throw new Error('Invalid Quote Request ID for invoice generation.');
    }

    const quoteRequest = await QuoteRequest.findById(quoteRequestId).lean<IQuoteRequest>();

    if (!quoteRequest) {
      throw new Error('Quote Request not found for invoice generation.');
    }
    if (quoteRequest.status !== 'approved') {
      throw new Error('Invoice can only be generated for approved quote requests.');
    }
    const existingInvoice = await Invoice.findOne({ quoteRequestId: new mongoose.Types.ObjectId(quoteRequestId) });
    if (existingInvoice) {
      throw new Error('An invoice already exists for this quote request. Please update the existing invoice.');
    }

    const quantity = quoteRequest.quantity;
    const itemTotalPrice = quantity * proposedPricePerUnit;
    const subtotal = itemTotalPrice;
    const calculatedTaxAmount = taxRate ? subtotal * taxRate : 0;
    const calculatedShippingCost = shippingCost || 0;
    const totalAmount = subtotal + calculatedTaxAmount + calculatedShippingCost;

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 90000) + 10000}`;
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 30);

    const vendorDetails = {
      vendorName: process.env.YOUR_COMPANY_NAME || 'PureGrain Leather',
      vendorAddress: process.env.YOUR_COMPANY_ADDRESS || '123 Leather Lane, Rawhide City, LTH 12345',
      vendorEmail: process.env.ADMIN_EMAIL || 'info@puregrain.com',
      vendorPhone: process.env.YOUR_COMPANY_PHONE || '+92 308 4578957',
      vendorBankDetails: {
        accountTitle: process.env.YOUR_BANK_ACCOUNT_TITLE || 'PUREGRAIN EXPORTS (SMC-PRIVATE) LIMITED',
        bankName: process.env.YOUR_BANK_NAME || 'Bank Alfalah',
        accountNumber: process.env.YOUR_BANK_ACCOUNT || '5573-5002834840',
        swiftCode: process.env.YOUR_BANK_SWIFT || 'LETHSWIFT',
        iban: process.env.YOUR_BANK_IBAN || 'LTXX XXXX XXXX XXXX XXXX',
      }
    };

    const newInvoiceData: Partial<IInvoice> = {
      // FIX: Convert ObjectId to string here as quoteRequestId is string in IInvoice
      quoteRequestId: new mongoose.Types.ObjectId(quoteRequestId).toString(),
      invoiceNumber: invoiceNumber,
      issueDate: issueDate,
      dueDate: dueDate,
      status: 'sent',
      
      customerName: quoteRequest.customerName,
      customerEmail: quoteRequest.customerEmail,
      companyName: quoteRequest.companyName,
      customerAddress: quoteRequest.additionalComments,
      customerCountry: quoteRequest.destinationCountry,

      ...vendorDetails,

      items: [{
        itemName: quoteRequest.itemName,
        quantity: quantity,
        quantityUnit: quoteRequest.quantityUnit,
        unitPrice: proposedPricePerUnit,
        totalPrice: itemTotalPrice,
      }],
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: calculatedTaxAmount,
      shippingCost: calculatedShippingCost,
      totalAmount: totalAmount,
      
      paymentTerms: paymentTerms,
      paymentInstructions: paymentInstructions,
      notes: notes,

      lcBankName: lcBankName,
      lcContactPerson: lcContactPerson,
      lcContactEmail: lcContactEmail,
    };

    const newInvoice = new Invoice(newInvoiceData);
    const savedInvoice = await newInvoice.save();

    await QuoteRequest.findByIdAndUpdate(quoteRequestId, {
      invoiceId: savedInvoice._id.toString(), // FIX: Convert ObjectId to string here
      status: 'approved',
      proposedPricePerUnit: proposedPricePerUnit,
      proposedTotalPrice: totalAmount,
      paymentMethod: paymentTerms === '100_advance' ? '100_advance_bank_transfer' : (paymentTerms === '30_70_split' ? '30_70_split_bank_transfer' : 'letter_of_credit'),
      'paymentDetails.accountTitle': vendorDetails.vendorBankDetails.accountTitle,
      'paymentDetails.bankName': vendorDetails.vendorBankDetails.bankName,
      'paymentDetails.accountNumber': vendorDetails.vendorBankDetails.accountNumber,
      'paymentDetails.swiftCode': vendorDetails.vendorBankDetails.swiftCode,
      'paymentDetails.iban': vendorDetails.vendorBankDetails.iban,
      lcDetails: paymentTerms === 'lc' ? {
        bankName: lcBankName!,
        contactPerson: lcContactPerson,
        contactEmail: lcContactEmail,
        documentsUploaded: false, // Ensure this is always boolean
        lcStatus: 'initiated'
      } : undefined
    });

    logger.info(`Invoice ${savedInvoice.invoiceNumber} generated and linked to Quote Request ${quoteRequestId}`);
    return savedInvoice;
  }

  public async getInvoiceById(id: string): Promise<IInvoice | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const invoice = await Invoice.findById(id).lean<IInvoice>();
      return invoice;
    } catch (error: any) {
      logger.error(`Error getting invoice by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  public async updateInvoiceStatus(invoiceId: string, status: IInvoice['status']): Promise<IInvoice | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        throw new Error('Invalid Invoice ID.');
      }
      const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, { status }, { new: true, runValidators: true }).lean<IInvoice>();
      logger.info(`Invoice ${invoiceId} status updated to: ${status}`);
      return updatedInvoice;
    } catch (error: any) {
      logger.error(`Error updating invoice ${invoiceId} status: ${error.message}`);
      throw error;
    }
  }

  public async getInvoiceByQuoteRequestId(quoteRequestId: string): Promise<IInvoice | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(quoteRequestId)) {
        return null;
      }
      const invoice = await Invoice.findOne({ quoteRequestId }).lean<IInvoice>();
      return invoice;
    } catch (error: any) {
      logger.error(`Error getting invoice by Quote Request ID ${quoteRequestId}: ${error.message}`);
      throw error;
    }
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;