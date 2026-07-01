// app/api/paypal/create-order/route.ts
//
// Creates a PayPal order for the sample-shipping fee. The amount is
// recomputed server-side from the country — the browser never gets to pick
// what it will be charged.
//
// Two pricing sources are supported:
//   1. Legacy single-product flow (`/request-sample/pay`):
//      uses the static rate table in `lib/config/shippingConfig.ts`.
//   2. New unified review flow (`/sample-request/review`):
//      caller passes `requestType` and the rate is read from the
//      `ShippingRate` collection (per-country DHL rates).
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaypalOrder, isPaypalConfigured, PaypalApiError } from '@/lib/services/paypalService';
import { getShippingQuote, COUNTRY_TO_CONTINENT_MAP } from '@/lib/config/shippingConfig';
import { resolveSampleShippingAmount } from '@/lib/services/sampleShippingService';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  country: z.string().min(1).max(80),
  productName: z.string().max(200).optional(),
  // Optional discriminator for the new review flow. When present, we look
  // up the per-country DHL rate from the database instead of the legacy
  // continent table.
  requestType: z.enum(['HIDE', 'FINISHED_PRODUCT']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!isPaypalConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Payment provider is not configured.' },
        { status: 503 }
      );
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request.', errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const { country, productName, requestType } = parsed.data;

    let amount: number;
    let region: string;

    if (requestType) {
      // New flow: resolve via the shared service (seeded ShippingRate DB,
      // falling back to the bundled static table). Using the SAME resolver as
      // capture-order guarantees the charged amount matches the verified one.
      const resolved = await resolveSampleShippingAmount(country);

      if (!resolved) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Shipping rate not available for this country. Our team will confirm the cost by email — please contact us instead of paying online.',
            code: 'SHIPPING_RATE_UNAVAILABLE',
          },
          { status: 422 }
        );
      }
      amount = resolved.amount;
      region = resolved.region;
    } else {
      // Legacy flow: static continent rates.
      const known = COUNTRY_TO_CONTINENT_MAP[country] !== undefined;
      const quote = getShippingQuote(known ? country : 'Other');
      amount = quote.amount;
      region = quote.region;
    }

    const order = await createPaypalOrder({
      amount,
      currency: 'USD',
      description: productName
        ? `PureGrain sample shipping — ${productName}`
        : 'PureGrain leather sample shipping fee',
      customId: `pg-sample-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        amount,
        currency: 'USD',
        region,
      },
    });
  } catch (error: any) {
    logger.error('[paypal/create-order] failed', error);

    if (error instanceof PaypalApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: error.details?.[0]?.issue || 'PAYPAL_API_ERROR',
          debugId: error.debugId,
          details: error.details,
        },
        { status: error.statusCode || 502 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || 'Unable to create order.' },
      { status: 500 }
    );
  }
}
