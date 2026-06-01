import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import connectDB from '@/lib/config/db';
import CustomManufacturingRequest from '@/lib/models/CustomManufacturingRequest';
import logger from '@/lib/config/logger';
import { sendEmail } from '@/lib/utils/sendEmail';
import { generateInvoicePdf } from '@/lib/utils/invoicePdfGenerator';
import { IInvoice, PaymentTerms } from '@/types/invoice';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  proposedPricePerUnit: z.number().positive('Proposed price per unit must be greater than 0.'),
  taxRate: z.number().min(0).max(1).optional(),
  shippingCost: z.number().min(0).optional(),
  paymentTerms: z.enum(['100_advance', '30_70_split', 'lc']),
  paymentInstructions: z.string().optional(),
  notes: z.string().optional(),
  lcBankName: z.string().optional(),
  lcContactPerson: z.string().optional(),
  lcContactEmail: z.string().email('Invalid LC contact email.').optional().or(z.literal('')),
});

const toPaymentMethod = (paymentTerms: PaymentTerms) => {
  if (paymentTerms === '100_advance') return '100_advance_bank_transfer';
  if (paymentTerms === '30_70_split') return '30_70_split_bank_transfer';
  return 'letter_of_credit';
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const { id } = await params;

    const idValidation = z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid custom request ID format.')
      .safeParse(id);

    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error (ID)',
          errors: idValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const bodyValidation = bodySchema.safeParse(payload);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error (Body)',
          errors: bodyValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const customRequest = await CustomManufacturingRequest.findById(id);
    if (!customRequest) {
      return NextResponse.json({ success: false, message: 'Custom request not found.' }, { status: 404 });
    }

    const {
      proposedPricePerUnit,
      taxRate,
      shippingCost,
      paymentTerms,
      paymentInstructions,
      notes,
      lcBankName,
      lcContactPerson,
      lcContactEmail,
    } = bodyValidation.data;

    if (paymentTerms === 'lc' && !lcBankName) {
      return NextResponse.json(
        { success: false, message: 'LC issuing bank name is required for Letter of Credit.' },
        { status: 400 }
      );
    }

    const existingInvoiceNumber = customRequest.invoiceNumber;
    if (existingInvoiceNumber) {
      return NextResponse.json(
        { success: false, message: 'An invoice already exists for this custom request.' },
        { status: 409 }
      );
    }

    const quantity = Number.parseFloat(customRequest.estimatedQuantity || '0') || 1;
    const sanitizedTaxRate = typeof taxRate === 'number' ? taxRate : 0;
    const sanitizedShippingCost = typeof shippingCost === 'number' ? shippingCost : 0;

    const subtotal = quantity * proposedPricePerUnit;
    const taxAmount = subtotal * sanitizedTaxRate;
    const totalAmount = subtotal + taxAmount + sanitizedShippingCost;

    const invoiceNumber = `CINV-${Date.now()}-${Math.floor(Math.random() * 90000) + 10000}`;
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const paymentConfirmationToken = crypto.randomBytes(32).toString('hex');
    const paymentConfirmationTokenExpiry = new Date();
    paymentConfirmationTokenExpiry.setDate(paymentConfirmationTokenExpiry.getDate() + 7);

    const paymentMethod = toPaymentMethod(paymentTerms);

    const vendorBankDetails = {
      accountTitle: process.env.YOUR_BANK_ACCOUNT_TITLE || 'PUREGRAIN EXPORTS (SMC-PRIVATE) LIMITED',
      bankName: process.env.YOUR_BANK_NAME || 'Bank Alfalah',
      accountNumber: process.env.YOUR_BANK_ACCOUNT || '5573-5002834840',
      swiftCode: process.env.YOUR_BANK_SWIFT || '',
      iban: process.env.YOUR_BANK_IBAN || '',
    };

    const invoiceForPdf: IInvoice = {
      _id: id,
      quoteRequestId: id,
      invoiceNumber,
      issueDate,
      dueDate,
      status: 'sent',
      customerName: customRequest.contactPerson,
      customerEmail: customRequest.email,
      companyName: customRequest.companyName,
      customerAddress: [
        `Quote Request For: ${customRequest.productType}`,
        `Dimensions: ${customRequest.specifications || 'N/A'}`,
        `Required Timeline: ${customRequest.timeline || 'N/A'}`,
        `Material Used: ${customRequest.preferredMaterial || 'N/A'}`,
        `Requested Color: ${customRequest.colors || 'N/A'}`,
      ].join('\n'),
      customerCountry: 'N/A',
      vendorName: process.env.YOUR_COMPANY_NAME || 'PureGrain Leather',
      vendorAddress: process.env.YOUR_COMPANY_ADDRESS || 'Lahore, Punjab, Pakistan',
      vendorEmail: process.env.ADMIN_EMAIL || 'info@puregrainexports.com',
      vendorPhone: process.env.YOUR_COMPANY_PHONE || '+92 308 4578957',
      vendorBankDetails,
      items: [
        {
          itemName: customRequest.productType,
          quantity,
          quantityUnit: 'units',
          unitPrice: proposedPricePerUnit,
          totalPrice: subtotal,
        },
      ],
      subtotal,
      taxRate: sanitizedTaxRate,
      taxAmount,
      shippingCost: sanitizedShippingCost,
      totalAmount,
      paymentTerms,
      paymentInstructions,
      notes,
      lcBankName: paymentTerms === 'lc' ? lcBankName : undefined,
      lcContactPerson: paymentTerms === 'lc' ? lcContactPerson : undefined,
      lcContactEmail: paymentTerms === 'lc' ? lcContactEmail || undefined : undefined,
      createdAt: issueDate,
      updatedAt: issueDate,
    };

    const invoicePdfBuffer = generateInvoicePdf({ invoice: invoiceForPdf });
    const pdfBase64 = invoicePdfBuffer.toString('base64');

    const updatedStatus = customRequest.status === 'submitted' || customRequest.status === 'requested' || customRequest.status === 'Pending'
      ? 'invoice_sent'
      : customRequest.status;

    await CustomManufacturingRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          invoiceNumber,
          proposedPricePerUnit,
          proposedTotalPrice: totalAmount,
          taxRate: sanitizedTaxRate,
          shippingCost: sanitizedShippingCost,
          paymentMethod,
          paymentStatus: 'payment_pending',
          status: updatedStatus,
          adminComments: notes || customRequest.adminComments,
          paymentDetails: {
            accountTitle: vendorBankDetails.accountTitle,
            bankName: vendorBankDetails.bankName,
            accountNumber: vendorBankDetails.accountNumber,
            swiftCode: vendorBankDetails.swiftCode,
            iban: vendorBankDetails.iban,
            customTerms: paymentInstructions,
          },
          lcDetails:
            paymentTerms === 'lc'
              ? {
                  bankName: lcBankName,
                  contactPerson: lcContactPerson,
                  contactEmail: lcContactEmail || undefined,
                  documentsUploaded: false,
                  lcStatus: 'initiated',
                }
              : undefined,
          paymentConfirmationToken,
          paymentConfirmationTokenExpiry,
          paymentConfirmationStatus: 'pending_review',
        },
      },
      { new: true }
    );

    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';
    const paymentConfirmationLink = `${baseUrl}/payment-confirmation/${paymentConfirmationToken}`;

    await sendEmail({
      to: customRequest.email,
      subject: `PureGrain: Invoice ${invoiceNumber} for Your Custom Request`,
      text: `Dear ${customRequest.contactPerson},\n\nYour custom manufacturing request has been reviewed and invoice #${invoiceNumber} is attached.\n\nTotal Amount: $${totalAmount.toFixed(2)} USD\nPayment Terms: ${paymentTerms}\n\nPlease confirm your payment using this link:\n${paymentConfirmationLink}\n\nThis link will expire in 7 days.`,
      html: `<p>Dear ${customRequest.contactPerson},</p>
             <p>Your custom manufacturing request has been reviewed and invoice #${invoiceNumber} is attached.</p>
             <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)} USD</p>
             <p><strong>Payment Terms:</strong> ${paymentTerms}</p>
             <p>Please confirm your payment using the link below:</p>
             <p><a href="${paymentConfirmationLink}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Confirm Payment</a></p>
             <p style="color:#666;font-size:14px;">This link will expire in 7 days.</p>`,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice generated and sent successfully.',
      data: {
        invoiceNumber,
        totalAmount,
        paymentTerms,
      },
    });
  } catch (error: any) {
    logger.error('Error generating custom invoice:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate custom invoice.' },
      { status: 500 }
    );
  }
}
