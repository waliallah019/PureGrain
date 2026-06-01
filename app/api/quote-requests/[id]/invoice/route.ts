// my-leather-platform/app/api/quote-requests/[id]/invoice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import quoteService from '@/lib/services/quoteService';
import invoiceService from '@/lib/services/invoiceService';
import NotificationService from '@/lib/services/notificationService';
import { handleApiError } from '@/lib/utils/errorHandler';
import { validateRequest } from "@/lib/middleware/validateRequest";
import { generateInvoiceCombinedSchema } from '@/lib/validators/quoteValidator';
import logger from '@/lib/config/logger';
import { sendEmail } from '@/lib/utils/sendEmail';
import { generateInvoicePdf } from '@/lib/utils/invoicePdfGenerator';
import { IInvoice } from '@/types/invoice';
import { INotification } from '@/lib/models/Notification';
import mongoose from 'mongoose';
import { z } from 'zod';
import crypto from 'crypto';
import QuoteRequest from '@/lib/models/QuoteRequest';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    // FIX: Await params as required by Next.js 15+
    const { id } = await context.params; // quoteRequestId

    // Read requestBody ONCE at the beginning
    const requestBody = await req.json();
    
    // Validate ID manually first
    const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quote Request ID format.');
    const idValidation = idSchema.safeParse(id);
    
    if (!idValidation.success) {
      logger.warn(`ID validation error for PATCH /api/quote-requests/${id}/invoice:`, idValidation.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error (ID)",
          errors: idValidation.error.errors.map((e: any) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    
    // Extract just the body schema from your combined schema
    // Assuming your generateInvoiceCombinedSchema has a body property
    const bodySchema = generateInvoiceCombinedSchema.shape.body;
    const bodyValidation = bodySchema.safeParse(requestBody);
    
    if (!bodyValidation.success) {
      logger.warn('Body validation error for PATCH /api/quote-requests/[id]/invoice:', bodyValidation.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error (Body)",
          errors: bodyValidation.error.errors.map((e: any) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    
    const validatedBody = bodyValidation.data;

    const quoteRequest = await quoteService.getQuoteRequestById(id);
    if (!quoteRequest) {
      return NextResponse.json({ success: false, message: "Quote Request not found." }, { status: 404 });
    }
    if (quoteRequest.status !== 'approved') {
      return NextResponse.json({ success: false, message: `Invoice can only be generated for approved quotes. Current status: ${quoteRequest.status}` }, { status: 400 });
    }
    const existingInvoice = await invoiceService.getInvoiceByQuoteRequestId(id);
    if (existingInvoice) {
      return NextResponse.json({ success: false, message: "An invoice already exists for this quote request. Please update the existing invoice instead." }, { status: 409 });
    }

    // Ensure these are correctly handled as numbers
    const proposedPricePerUnit = Number(validatedBody.proposedPricePerUnit);
    const taxRate = validatedBody.taxRate !== undefined && validatedBody.taxRate !== '' ? Number(validatedBody.taxRate) : undefined;
    const shippingCost = validatedBody.shippingCost !== undefined && validatedBody.shippingCost !== '' ? Number(validatedBody.shippingCost) : undefined;

    // Additional validation for numbers (though Zod should handle most of it now)
    if (isNaN(proposedPricePerUnit) || (taxRate !== undefined && isNaN(taxRate)) || (shippingCost !== undefined && isNaN(shippingCost))) {
        return NextResponse.json({ success: false, message: "Invalid numeric input provided for pricing." }, { status: 400 });
    }
    if (proposedPricePerUnit <= 0) {
        return NextResponse.json({ success: false, message: "Proposed price per unit must be greater than 0." }, { status: 400 });
    }

    const newInvoice = await invoiceService.generateInvoice({
      quoteRequestId: id,
      proposedPricePerUnit: proposedPricePerUnit,
      paymentTerms: validatedBody.paymentTerms,
      taxRate: taxRate,
      shippingCost: shippingCost,
      paymentInstructions: validatedBody.paymentInstructions,
      notes: validatedBody.notes,
      lcBankName: validatedBody.lcBankName,
      lcContactPerson: validatedBody.lcContactPerson,
      lcContactEmail: validatedBody.lcContactEmail,
    });

    const invoicePdfBuffer = generateInvoicePdf({ invoice: newInvoice });
    const pdfBase64 = invoicePdfBuffer.toString('base64');

    // Generate payment confirmation token
    const paymentConfirmationToken = crypto.randomBytes(32).toString('hex');
    const paymentConfirmationTokenExpiry = new Date();
    paymentConfirmationTokenExpiry.setDate(paymentConfirmationTokenExpiry.getDate() + 7); // Token valid for 7 days

    // Update quote request with payment confirmation token
    await QuoteRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          paymentConfirmationToken,
          paymentConfirmationTokenExpiry
        }
      }
    );

    // Generate payment confirmation link
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
      : 'http://localhost:3000';
    const paymentConfirmationLink = `${baseUrl}/payment-confirmation/${paymentConfirmationToken}`;

    const customerEmailSubject = `PureGrain: Invoice ${newInvoice.invoiceNumber} for Your Quote Request`;
    const customerInstructionsText = (newInvoice.paymentInstructions || '').trim();
    const escapedCustomerInstructions = customerInstructionsText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const customerInstructionsTextBlock = customerInstructionsText
      ? `\n\nAdditional Guidelines:\n${customerInstructionsText}`
      : '';
    const customerInstructionsHtmlBlock = customerInstructionsText
      ? `<p><strong>Additional Guidelines:</strong></p><p style="white-space: pre-line;">${escapedCustomerInstructions}</p>`
      : '';

    const customerEmailText = `Dear ${quoteRequest.customerName},\n\nYour quote request for "${quoteRequest.itemName}" has been approved, and your invoice #${newInvoice.invoiceNumber} is attached.\n\nTotal Amount: $${newInvoice.totalAmount.toFixed(2)} USD\nPayment Terms: ${newInvoice.paymentTerms}${customerInstructionsTextBlock}\n\nPlease confirm your payment using this link:\n${paymentConfirmationLink}\n\nThis link will expire in 7 days.\n\nWe look forward to fulfilling your order!`;

    await sendEmail({
      to: quoteRequest.customerEmail,
      subject: customerEmailSubject,
      text: customerEmailText,
      html: `<p>Dear ${quoteRequest.customerName},</p>
             <p>Your quote request for "${quoteRequest.itemName}" has been approved, and your invoice #${newInvoice.invoiceNumber} is attached.</p>
             <p><strong>Total Amount:</strong> $${newInvoice.totalAmount.toFixed(2)} USD</p>
             <p><strong>Payment Terms:</strong> ${newInvoice.paymentTerms}</p>
             ${customerInstructionsHtmlBlock}
             <p>Please confirm your payment using the link below:</p>
             <p><a href="${paymentConfirmationLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Confirm Payment</a></p>
             <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
             <p>We look forward to fulfilling your order!</p>`,
      attachments: [
        {
          filename: `Invoice_${newInvoice.invoiceNumber}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    });
    logger.info(`Invoice email sent to customer ${quoteRequest.customerEmail} for Quote ID ${id}.`);

    await NotificationService.createNotification({
      title: `Invoice Sent: ${newInvoice.invoiceNumber}`,
      message: `Invoice #${newInvoice.invoiceNumber} for Quote ID ${id.substring(0,8)}... has been sent to ${quoteRequest.companyName}.`,
      type: 'invoice_sent',
      link: `/admin-ahmza/quotes/${id}`,
      relatedId: new mongoose.Types.ObjectId(id),
    });

    return NextResponse.json({ success: true, message: "Invoice generated and sent successfully.", data: newInvoice }, { status: 200 });
  } catch (error) {
    logger.error('Error in PATCH /api/quote-requests/[id]/invoice:', error);
    return handleApiError(error);
  }
}