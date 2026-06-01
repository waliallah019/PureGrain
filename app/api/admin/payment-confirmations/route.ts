// app/api/admin/payment-confirmations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import SampleRequest from '@/lib/models/sampleRequestModel';
import QuoteRequest from '@/lib/models/QuoteRequest';
import CustomManufacturingRequest from '@/lib/models/CustomManufacturingRequest';
import sampleService from '@/lib/services/sampleService';
import quoteService from '@/lib/services/quoteService';
import { sendEmail } from '@/lib/utils/sendEmail';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payment-confirmations?request_id={id}&request_type={sample|quote|custom}
 * Fetch payment confirmations for a specific request
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('request_id');
    const requestType = searchParams.get('request_type') as 'sample' | 'quote' | 'custom';

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    if (!requestType || !['sample', 'quote', 'custom'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Valid request type is required (sample, quote, or custom)' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetRequest: any = null;

    if (requestType === 'sample') {
      targetRequest = await SampleRequest.findById(requestId);
    } else if (requestType === 'quote') {
      targetRequest = await QuoteRequest.findById(requestId);
    } else {
      targetRequest = await CustomManufacturingRequest.findById(requestId);
    }

    if (!targetRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if payment confirmation has been submitted
    if (!targetRequest.paymentConfirmationSubmittedAt) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No payment confirmations submitted yet'
      });
    }

    // Return payment confirmation details
    const confirmationData = {
      id: targetRequest._id.toString(),
      requestNumber: targetRequest.requestNumber || targetRequest._id.toString().substring(0, 8),
      requestType: requestType,
      amount: targetRequest.paymentConfirmationAmount,
      paymentMethod: targetRequest.paymentConfirmationMethod,
      submittedAt: targetRequest.paymentConfirmationSubmittedAt,
      status: targetRequest.paymentConfirmationStatus || 'pending_review',
      proofUrl: targetRequest.paymentConfirmationProofUrl,
    };

    return NextResponse.json({
      success: true,
      data: [confirmationData], // Return as array for consistency
    });

  } catch (error) {
    console.error('Error fetching payment confirmations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment confirmations' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/payment-confirmations
 * Update payment confirmation status (approve/reject)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, requestType, status } = body;

    if (!requestId || !requestType || !status) {
      return NextResponse.json(
        { error: 'Request ID, request type, and status are required' },
        { status: 400 }
      );
    }

    if (!['sample', 'quote', 'custom'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Valid request type is required (sample, quote, or custom)' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either approved or rejected' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetRequest: any = null;
    let requestModel: any = null;

    if (requestType === 'sample') {
      targetRequest = await SampleRequest.findById(requestId);
      requestModel = SampleRequest;
    } else if (requestType === 'quote') {
      targetRequest = await QuoteRequest.findById(requestId);
      requestModel = QuoteRequest;
    } else {
      targetRequest = await CustomManufacturingRequest.findById(requestId);
      requestModel = CustomManufacturingRequest;
    }

    if (!targetRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Update payment confirmation status first
    await requestModel.findByIdAndUpdate(
      requestId,
      { $set: { paymentConfirmationStatus: status } },
      { new: true }
    );

    // If approved, update the main payment status using service methods (to trigger emails)
    if (status === 'approved') {
      if (requestType === 'sample') {
        await sampleService.updateSampleRequest(requestId, { paymentStatus: 'paid' });
      } else if (requestType === 'quote') {
        await quoteService.updateQuoteRequest(requestId, { status: 'paid' });
      } else if (requestType === 'custom') {
        await requestModel.findByIdAndUpdate(
          requestId,
          { $set: { paymentStatus: 'paid', status: 'Completed' } },
          { new: true }
        );
      }
      if (requestType === 'custom') {
        void sendEmail({
          to: targetRequest.email,
          subject: `PureGrain: Payment Confirmed for Your Custom Request (Ref: ${targetRequest.requestNumber})`,
          text: `Dear ${targetRequest.contactPerson},\n\nThank you! Your payment confirmation for custom request ${targetRequest.requestNumber} has been approved. Your order is now confirmed and will proceed to the next stage.\n\nBest regards,\nPureGrain Team`,
          html: `<p>Dear ${targetRequest.contactPerson},</p><p>Thank you! Your payment confirmation for custom request <strong>${targetRequest.requestNumber}</strong> has been approved. Your order is now confirmed and will proceed to the next stage.</p><p>Best regards,<br/>PureGrain Team</p>`,
        }).catch((err) => {
          console.error('Failed to send custom payment approval email:', err);
        });
      }
    } else if (requestType === 'custom') {
      await requestModel.findByIdAndUpdate(
        requestId,
        { $set: { paymentStatus: 'rejected' } },
        { new: true }
      );
      void sendEmail({
        to: targetRequest.email,
        subject: `PureGrain: Payment Confirmation Rejected for Your Custom Request (Ref: ${targetRequest.requestNumber})`,
        text: `Dear ${targetRequest.contactPerson},\n\nYour payment confirmation for custom request ${targetRequest.requestNumber} was rejected. Please review the uploaded proof and contact us if you need assistance.\n\nBest regards,\nPureGrain Team`,
        html: `<p>Dear ${targetRequest.contactPerson},</p><p>Your payment confirmation for custom request <strong>${targetRequest.requestNumber}</strong> was rejected. Please review the uploaded proof and contact us if you need assistance.</p><p>Best regards,<br/>PureGrain Team</p>`,
      }).catch((err) => {
        console.error('Failed to send custom payment rejection email:', err);
      });
    }

    if (requestType === 'quote' && status === 'rejected') {
      await requestModel.findByIdAndUpdate(
        requestId,
        { $set: { status: 'approved' } },
        { new: true }
      );
    }

    if (requestType === 'sample' && status === 'rejected') {
      await requestModel.findByIdAndUpdate(
        requestId,
        { $set: { paymentStatus: 'pending' } },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payment confirmation ${status} successfully`,
      data: { status },
    });

  } catch (error) {
    console.error('Error updating payment confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to update payment confirmation status' },
      { status: 500 }
    );
  }
}
