// app/api/paypal/create-order/route.ts
//
// Creates a PayPal order for the sample-shipping fee. The amount is
// recomputed server-side from the country — the browser never gets to pick
// what it will be charged.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaypalOrder, isPaypalConfigured, PaypalApiError } from '@/lib/services/paypalService';
import { getShippingQuote, COUNTRY_TO_CONTINENT_MAP } from '@/lib/config/shippingConfig';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  country: z.string().min(1).max(80),
  productName: z.string().max(200).optional(),
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

    const { country, productName } = parsed.data;
    const known = COUNTRY_TO_CONTINENT_MAP[country] !== undefined;
    const quote = getShippingQuote(known ? country : 'Other');

    const order = await createPaypalOrder({
      amount: quote.amount,
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
        amount: quote.amount,
        currency: 'USD',
        region: quote.region,
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
