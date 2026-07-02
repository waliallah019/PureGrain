// app/api/paypal/capture-order/route.ts
//
// Captures the PayPal order, re-verifies the paid amount against the
// server-side shipping quote, then persists the SampleRequest with
// paymentStatus = 'paid' and the PayPal transaction reference.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import connectDB from '@/lib/config/db';
import SampleRequest from '@/lib/models/sampleRequestModel';
import sampleService from '@/lib/services/sampleService';
import { capturePaypalOrder, isPaypalConfigured } from '@/lib/services/paypalService';
import { getShippingQuote, COUNTRY_TO_CONTINENT_MAP } from '@/lib/config/shippingConfig';
import { resolveSampleShippingAmount } from '@/lib/services/sampleShippingService';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderId: z.string().min(5).max(64),
  // Discriminator for the unified review flow. When present, the expected
  // shipping amount is resolved from the SAME source as create-order so the
  // captured amount can never be rejected due to a table mismatch.
  requestType: z.enum(['HIDE', 'FINISHED_PRODUCT']).optional(),
  form: z.object({
    companyName: z.string().min(1).max(120),
    contactPerson: z.string().min(1).max(120),
    email: z.string().email().max(160),
    phone: z.string().max(40).optional().or(z.literal('')),
    country: z.string().min(1).max(80),
    address: z.string().min(5).max(600),
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().or(z.literal('')),
    productName: z.string().max(200).optional().or(z.literal('')),
    productTypeCategory: z.enum(['finished-product', 'raw-leather']).optional(),
    sampleType: z.enum(['raw-leather', 'finished-products', 'both']).optional(),
    quantitySamples: z.string().max(60).optional().or(z.literal('')),
    materialPreference: z.string().max(120).optional().or(z.literal('')),
    finishType: z.string().max(120).optional().or(z.literal('')),
    colorPreferences: z.string().max(200).optional().or(z.literal('')),
    specificRequests: z.string().max(2000).optional().or(z.literal('')),
  }),
});

export async function POST(req: NextRequest) {
  try {
    if (!isPaypalConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Payment provider is not configured.' },
        { status: 503 }
      );
    }

    await connectDB();

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request.', errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const { orderId, requestType, form } = parsed.data;

    // Idempotency: if we've already saved a request for this PayPal order,
    // return it instead of double-capturing / double-saving.
    const existing = await SampleRequest.findOne({ paypalOrderId: orderId }).lean<any>();
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Order already processed.',
        data: {
          requestNumber: existing.requestNumber,
          paymentStatus: existing.paymentStatus,
          paypalTransactionId: existing.paypalTransactionId,
        },
      });
    }

    // Server-side amount the buyer SHOULD have paid for this country.
    // New review flow resolves via the shared service (same source as
    // create-order); legacy single-product flow uses the continent table.
    // This is resolved BEFORE capture so an unknown country never charges.
    let expectedAmount: number;
    if (requestType) {
      const resolved = await resolveSampleShippingAmount(form.country);
      if (!resolved) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Shipping rate not available for this country. Please contact support before paying online.',
            code: 'SHIPPING_RATE_UNAVAILABLE',
          },
          { status: 422 }
        );
      }
      expectedAmount = resolved.amount;
    } else {
      const known = COUNTRY_TO_CONTINENT_MAP[form.country] !== undefined;
      expectedAmount = getShippingQuote(known ? form.country : 'Other').amount;
    }

    const capture = await capturePaypalOrder(orderId);
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: `Payment not completed (status: ${capture.status}).` },
        { status: 402 }
      );
    }

    const captureRecord = capture.purchase_units?.[0]?.payments?.captures?.[0];
    if (!captureRecord || captureRecord.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'Payment capture record missing or not completed.' },
        { status: 402 }
      );
    }

    const paidAmount = parseFloat(captureRecord.amount.value);
    const paidCurrency = captureRecord.amount.currency_code;

    if (paidCurrency !== 'USD' || Math.abs(paidAmount - expectedAmount) > 0.01) {
      logger.error('[paypal/capture] amount/currency mismatch', {
        orderId,
        paidAmount,
        paidCurrency,
        expected: expectedAmount,
        country: form.country,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Paid amount does not match the expected shipping fee. Please contact support.',
        },
        { status: 409 }
      );
    }

    // Generate a payment-confirmation token so this request still flows
    // through the existing admin lifecycle UI.
    const paymentConfirmationToken = crypto.randomBytes(24).toString('hex');
    const paymentConfirmationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const saved = await sampleService.createSampleRequest({
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone || undefined,
      country: form.country,
      address: form.address,
      sampleType: (form.sampleType ||
        (form.productTypeCategory === 'raw-leather' ? 'raw-leather' : 'finished-products')) as any,
      quantitySamples: form.quantitySamples || '1-3 samples',
      materialPreference: form.materialPreference || undefined,
      finishType: form.finishType || undefined,
      colorPreferences: form.colorPreferences || undefined,
      specificRequests: form.specificRequests || undefined,
      productId: form.productId ? (form.productId as any) : undefined,
      productName: form.productName || undefined,
      productTypeCategory: form.productTypeCategory,
      shippingFee: expectedAmount,
      paymentStatus: 'paid',
      paymentMethod: 'paypal',
      paypalOrderId: orderId,
      paypalTransactionId: captureRecord.id,
      paypalCaptureStatus: captureRecord.status,
      paypalPayerEmail: capture.payer?.email_address,
      paymentCompletedAt: new Date(),
      paymentConfirmationToken,
      paymentConfirmationTokenExpiry,
      paymentConfirmationStatus: 'verified',
      paymentConfirmationAmount: expectedAmount,
      paymentConfirmationMethod: 'PayPal',
      paymentConfirmationSubmittedAt: new Date(),
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Payment received. Sample request submitted.',
      data: {
        requestNumber: saved.requestNumber,
        paymentStatus: saved.paymentStatus,
        paypalTransactionId: captureRecord.id,
        amount: expectedAmount,
        currency: 'USD',
      },
    });
  } catch (error: any) {
    logger.error('[paypal/capture-order] failed', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Unable to capture order.' },
      { status: 500 }
    );
  }
}
