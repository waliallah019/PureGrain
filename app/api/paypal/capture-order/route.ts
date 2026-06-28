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
import ShippingRate from '@/lib/models/ShippingRate';
import sampleService from '@/lib/services/sampleService';
import { capturePaypalOrder, isPaypalConfigured } from '@/lib/services/paypalService';
import { getShippingQuote, COUNTRY_TO_CONTINENT_MAP } from '@/lib/config/shippingConfig';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

// Item shape used by the new unified review flow. All hide-specific and
// finished-product-specific fields are optional so the same schema covers
// both flows without forking the validator.
const itemSchema = z.object({
  productId: z.string().max(64).optional(),
  productName: z.string().max(200).optional(),
  productType: z.string().max(60).optional(),
  hideType: z.string().max(60).optional(),
  grade: z.string().max(60).optional(),
  thickness: z.string().max(60).optional(),
  tanningMethod: z.string().max(60).optional(),
  finish: z.string().max(60).optional(),
  variantId: z.string().max(64).optional(),
  variantName: z.string().max(120).optional(),
});

const bodySchema = z.object({
  orderId: z.string().min(5).max(64),
  // New (additive): when present, the request goes through the per-country
  // ShippingRate lookup. When absent, we fall back to the legacy continent
  // table — preserving the existing /request-sample/pay flow byte-for-byte.
  requestType: z.enum(['HIDE', 'FINISHED_PRODUCT']).optional(),
  items: z.array(itemSchema).max(3).optional(),
  industry: z.string().max(80).optional(),
  website: z.string().max(200).optional(),
  notes: z.string().max(300).optional(),
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

    const { orderId, form, requestType, items, industry, website, notes } = parsed.data;

    // Idempotency: if we've already saved a request for this PayPal order,
    // return it instead of double-capturing / double-saving.
    const existing = await SampleRequest.findOne({ paypalOrderId: orderId }).lean<any>();
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Order already processed.',
        data: {
          requestNumber: existing.requestNumber,
          orderRef: existing.orderRef,
          paymentStatus: existing.paymentStatus,
          paypalTransactionId: existing.paypalTransactionId,
        },
      });
    }

    // ---- Per-flow validation of the items array -----------------------------
    if (requestType === 'HIDE') {
      if (!items || items.length < 1 || items.length > 3) {
        return NextResponse.json(
          { success: false, message: 'Hide sample requests must include 1 to 3 items.' },
          { status: 400 }
        );
      }
      for (const it of items) {
        if (!it.productId || !it.hideType) {
          return NextResponse.json(
            { success: false, message: 'Each hide item must include a productId and hideType.' },
            { status: 400 }
          );
        }
      }
    } else if (requestType === 'FINISHED_PRODUCT') {
      if (!items || items.length !== 1) {
        return NextResponse.json(
          { success: false, message: 'Finished-product sample requests must include exactly 1 item.' },
          { status: 400 }
        );
      }
    }

    // ---- Server-side amount the buyer SHOULD have paid for this country ----
    let expectedAmount: number;
    let estimatedDays: string | undefined;

    if (requestType) {
      const rate = await ShippingRate.findOne({
        country: { $regex: `^${form.country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        isActive: true,
      }).lean<any>();
      if (!rate) {
        return NextResponse.json(
          { success: false, message: 'Shipping rate not configured for this country. Please contact support.' },
          { status: 422 }
        );
      }
      expectedAmount = rate.rateUsd;
      estimatedDays = rate.transitDays;
    } else {
      const known = COUNTRY_TO_CONTINENT_MAP[form.country] !== undefined;
      const quote = getShippingQuote(known ? form.country : 'Other');
      expectedAmount = quote.amount;
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

    // Resolve the legacy single-product fields. For the new HIDE flow there
    // is no single product, so we synthesize a friendly summary instead.
    const legacyProductName =
      form.productName ||
      (requestType === 'HIDE' && items
        ? items.map((i) => i.productName).filter(Boolean).join(', ')
        : '') ||
      undefined;

    const saved = await sampleService.createSampleRequest({
      requestType,
      items: items as any,
      industry,
      website,
      notes,
      estimatedDays,
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone || undefined,
      country: form.country,
      address: form.address,
      sampleType: (form.sampleType ||
        (requestType === 'HIDE'
          ? 'raw-leather'
          : form.productTypeCategory === 'raw-leather'
            ? 'raw-leather'
            : 'finished-products')) as any,
      quantitySamples:
        form.quantitySamples ||
        (requestType === 'HIDE' && items ? `${items.length} hide sample${items.length === 1 ? '' : 's'}` : '1-3 samples'),
      materialPreference: form.materialPreference || undefined,
      finishType: form.finishType || undefined,
      colorPreferences: form.colorPreferences || undefined,
      specificRequests: form.specificRequests || undefined,
      productId: form.productId ? (form.productId as any) : undefined,
      productName: legacyProductName,
      productTypeCategory:
        form.productTypeCategory ||
        (requestType === 'HIDE' ? 'raw-leather' : requestType === 'FINISHED_PRODUCT' ? 'finished-product' : undefined),
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
        orderRef: saved.orderRef,
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
