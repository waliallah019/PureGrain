// app/api/shipping-fee/route.ts
//
// Backend-controlled shipping fee endpoint. The browser must NEVER compute
// the amount it will pay; it must always read the authoritative quote from
// here (and the server must re-validate the same value at order capture
// time so a tampered client can't underpay).
import { NextRequest, NextResponse } from 'next/server';
import { getShippingQuote, COUNTRY_TO_CONTINENT_MAP } from '@/lib/config/shippingConfig';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const country = (req.nextUrl.searchParams.get('country') || '').trim();
    if (!country) {
      return NextResponse.json(
        { success: false, message: 'country query parameter is required.' },
        { status: 400 }
      );
    }

    // Treat unknown countries as the catch-all "Other" tier rather than 404
    // — keeps the UX smooth while still using the server-controlled rate.
    const known = COUNTRY_TO_CONTINENT_MAP[country] !== undefined;
    const quote = getShippingQuote(known ? country : 'Other');

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        country, // echo back the requested country label
        recognized: known,
      },
    });
  } catch (error: any) {
    logger.error('[shipping-fee] failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to compute shipping fee.' },
      { status: 500 }
    );
  }
}
