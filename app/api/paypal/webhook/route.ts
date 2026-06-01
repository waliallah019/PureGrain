// app/api/paypal/webhook/route.ts
//
// Receives PayPal webhook events and (after signature verification) keeps
// our DB in sync. The capture-order route already saves the SampleRequest
// for the typical happy path; this handler covers async/late events such
// as PAYMENT.CAPTURE.REFUNDED or REVERSED.
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import SampleRequest from '@/lib/models/sampleRequestModel';
import { verifyPaypalWebhookSignature } from '@/lib/services/paypalService';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const verified = await verifyPaypalWebhookSignature({
      headers: req.headers,
      body: rawBody,
    });

    if (!verified) {
      logger.warn('[paypal/webhook] rejected unverified event');
      return NextResponse.json({ success: false, message: 'Invalid signature.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as { event_type: string; resource: any };
    logger.info('[paypal/webhook] event', { type: event.event_type });

    await connectDB();
    const resource = event.resource || {};
    const captureId: string | undefined = resource?.id;
    // PayPal puts the related order id in supplementary_data.related_ids.order_id
    const orderId: string | undefined =
      resource?.supplementary_data?.related_ids?.order_id || undefined;

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        if (!orderId && !captureId) break;
        await SampleRequest.findOneAndUpdate(
          orderId ? { paypalOrderId: orderId } : { paypalTransactionId: captureId },
          {
            paymentStatus: 'paid',
            paypalCaptureStatus: 'COMPLETED',
            paymentCompletedAt: new Date(),
            ...(captureId ? { paypalTransactionId: captureId } : {}),
          }
        );
        break;
      }
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        await SampleRequest.findOneAndUpdate(
          orderId ? { paypalOrderId: orderId } : { paypalTransactionId: captureId },
          {
            paymentStatus: 'failed',
            paypalCaptureStatus: 'DENIED',
            paymentError: { code: event.event_type, message: 'Capture denied by PayPal.' },
          }
        );
        break;
      }
      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        await SampleRequest.findOneAndUpdate(
          orderId ? { paypalOrderId: orderId } : { paypalTransactionId: captureId },
          {
            paymentStatus: 'refunded',
            paypalCaptureStatus: event.event_type.replace('PAYMENT.CAPTURE.', ''),
          }
        );
        break;
      }
      default:
        // Ignore unrelated events; PayPal expects 200 either way.
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[paypal/webhook] failed', error);
    // Returning 200 here would make PayPal stop retrying — return 500 so it
    // retries on transient failures.
    return NextResponse.json({ success: false, message: 'Webhook processing failed.' }, { status: 500 });
  }
}
