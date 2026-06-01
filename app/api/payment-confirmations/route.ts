// app/api/payment-confirmations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import SampleRequest from '@/lib/models/sampleRequestModel';
import QuoteRequest from '@/lib/models/QuoteRequest';
import CustomManufacturingRequest from '@/lib/models/CustomManufacturingRequest';
import cloudinary from '@/lib/config/cloudinary';
import { sendEmail } from '@/lib/utils/sendEmail';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payment-confirmations
 * Submit payment confirmation with proof file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const token = formData.get('token') as string;
    const requestType = formData.get('request_type') as 'sample' | 'quote' | 'custom';
    const amount = formData.get('amount') as string;
    const paymentMethod = formData.get('payment_method') as string;
    const proofFile = formData.get('proof_file') as File;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!requestType || !['sample', 'quote', 'custom'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Valid request type is required (sample, quote, or custom)' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (!proofFile) {
      return NextResponse.json(
        { error: 'Payment proof file is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the request based on token
    let targetRequest: any = null;
    let requestModel: any = null;

    if (requestType === 'sample') {
      targetRequest = await SampleRequest.findOne({
        paymentConfirmationToken: token,
        paymentConfirmationTokenExpiry: { $gt: new Date() }
      });
      requestModel = SampleRequest;
    } else if (requestType === 'quote') {
      targetRequest = await QuoteRequest.findOne({
        paymentConfirmationToken: token,
        paymentConfirmationTokenExpiry: { $gt: new Date() }
      });
      requestModel = QuoteRequest;
    } else {
      targetRequest = await CustomManufacturingRequest.findOne({
        paymentConfirmationToken: token,
        paymentConfirmationTokenExpiry: { $gt: new Date() }
      });
      requestModel = CustomManufacturingRequest;
    }

    if (!targetRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired payment confirmation token' },
        { status: 404 }
      );
    }

    // Upload payment proof to Cloudinary (serverless-safe, no local disk writes)
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const b64 = buffer.toString('base64');
    const dataUri = `data:${proofFile.type || 'application/octet-stream'};base64,${b64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'payment-proofs',
      resource_type: 'auto',
      quality: 'auto:eco',
      fetch_format: 'auto',
      public_id: `payment-proof-${targetRequest.requestNumber}-${Date.now()}`,
    });

    // Update the request with payment confirmation details
    // Note: These fields would need to be added to your models
    const updateData: any = {
      paymentConfirmationSubmittedAt: new Date(),
      paymentConfirmationAmount: parseFloat(amount),
      paymentConfirmationMethod: paymentMethod,
      paymentConfirmationProofUrl: uploadResult.secure_url,
      paymentConfirmationStatus: 'pending_review', // Add this status to your model
    };

    // For sample requests, you might want to update paymentStatus
    if (requestType === 'sample') {
      updateData.paymentStatus = 'processing';
    } else if (requestType === 'quote') {
      updateData.status = 'approved';
    } else if (requestType === 'custom') {
      updateData.paymentStatus = 'processing';
    }

    await requestModel.findByIdAndUpdate(
      targetRequest._id,
      { $set: updateData },
      { new: true }
    );

    if (process.env.ADMIN_EMAIL) {
      const requestTypeLabel = requestType === 'sample'
        ? 'Sample Request'
        : requestType === 'quote'
          ? 'Quote Request'
          : 'Custom Request';
      const contactName = targetRequest.contactPerson || targetRequest.customerName || 'N/A';
      const contactEmail = targetRequest.email || targetRequest.customerEmail || 'N/A';

      const adminSummary = [
        `A payment confirmation has been uploaded for a ${requestTypeLabel}.`,
        '',
        `Request Type: ${requestTypeLabel}`,
        `Request Number: ${targetRequest.requestNumber}`,
        `Company: ${targetRequest.companyName || 'N/A'}`,
        `Contact Person: ${contactName}`,
        `Email: ${contactEmail}`,
        `Amount: $${parseFloat(amount).toFixed(2)} USD`,
        `Payment Method: ${paymentMethod}`,
        `Proof URL: ${uploadResult.secure_url}`,
      ].join('\n');

      void sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Payment Confirmation Uploaded: ${targetRequest.requestNumber} (${requestTypeLabel})`,
        text: adminSummary,
        html: `<p>A payment confirmation has been uploaded for a ${requestTypeLabel}.</p>
               <p><strong>Request Type:</strong> ${requestTypeLabel}</p>
               <p><strong>Request Number:</strong> ${targetRequest.requestNumber}</p>
               <p><strong>Company:</strong> ${targetRequest.companyName || 'N/A'}</p>
               <p><strong>Contact Person:</strong> ${contactName}</p>
               <p><strong>Email:</strong> ${contactEmail}</p>
               <p><strong>Amount:</strong> $${parseFloat(amount).toFixed(2)} USD</p>
               <p><strong>Payment Method:</strong> ${paymentMethod}</p>
               <p><strong>Proof URL:</strong> <a href="${uploadResult.secure_url}" target="_blank" rel="noopener noreferrer">View Proof</a></p>`,
      }).catch((err) => {
        logger.error(`[PaymentConfirmation] Failed to email admin about proof upload for ${targetRequest._id}:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Your payment confirmation has been submitted and is pending review.',
      data: {
        requestNumber: targetRequest.requestNumber,
        submittedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Payment confirmation submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit payment confirmation. Please try again or contact support.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
