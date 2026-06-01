// app/api/payment-confirmation/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import SampleRequest from '@/lib/models/sampleRequestModel';
import QuoteRequest from '@/lib/models/QuoteRequest';
import CustomManufacturingRequest from '@/lib/models/CustomManufacturingRequest';

/**
 * GET /api/payment-confirmation/:token
 * Validates the payment confirmation token and returns request information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Try to find in Sample Requests first
    const sampleRequest = await SampleRequest.findOne({
      paymentConfirmationToken: token,
      paymentConfirmationTokenExpiry: { $gt: new Date() }
    });

    if (sampleRequest) {
      return NextResponse.json({
        success: true,
        data: {
          requestType: 'Sample',
          requestId: sampleRequest.requestNumber || sampleRequest._id,
          requestNumber: sampleRequest.requestNumber,
          companyName: sampleRequest.companyName,
          contactPerson: sampleRequest.contactPerson,
          email: sampleRequest.email,
          expectedAmount: sampleRequest.shippingFee,
          currency: 'USD',
          status: sampleRequest.paymentStatus,
          createdAt: sampleRequest.createdAt,
        }
      });
    }

    // Try to find in Quote Requests
    const quoteRequest = await QuoteRequest.findOne({
      paymentConfirmationToken: token,
      paymentConfirmationTokenExpiry: { $gt: new Date() }
    });

    if (quoteRequest) {
      return NextResponse.json({
        success: true,
        data: {
          requestType: 'Quote',
          requestId: quoteRequest.requestNumber || quoteRequest._id,
          requestNumber: quoteRequest.requestNumber,
          companyName: quoteRequest.companyName,
          customerName: quoteRequest.customerName,
          email: quoteRequest.customerEmail,
          expectedAmount: quoteRequest.proposedTotalPrice,
          currency: 'USD',
          status: quoteRequest.status,
          createdAt: quoteRequest.createdAt,
        }
      });
    }

    // Try to find in Custom Manufacturing Requests
    const customRequest = await CustomManufacturingRequest.findOne({
      paymentConfirmationToken: token,
      paymentConfirmationTokenExpiry: { $gt: new Date() }
    });

    if (customRequest) {
      return NextResponse.json({
        success: true,
        data: {
          requestType: 'Custom',
          requestId: customRequest.requestNumber || customRequest._id,
          requestNumber: customRequest.requestNumber,
          companyName: customRequest.companyName,
          contactPerson: customRequest.contactPerson,
          email: customRequest.email,
          expectedAmount: customRequest.proposedTotalPrice,
          currency: 'USD',
          status: customRequest.paymentStatus || customRequest.status,
          createdAt: customRequest.createdAt,
        }
      });
    }

    // Token not found or expired
    return NextResponse.json(
      { error: 'Invalid or expired payment confirmation link' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Payment confirmation token validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
