import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import quoteService from '@/lib/services/quoteService';
import { handleApiError } from '@/lib/utils/errorHandler';
import logger from '@/lib/config/logger';
import { z } from 'zod';
import { updateQuoteRequestRequestBodySchema } from '@/lib/validators/quoteValidator';
import { IQuoteRequest } from '@/types/quote';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    // Await params as required by Next.js 15+
    const { id } = await params;

    // Manually validate the ID using Zod
    const quoteRequestIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quote Request ID format.');

    const validationResult = quoteRequestIdSchema.safeParse(id);

    if (!validationResult.success) {
      logger.warn(`Manual validation error for GET /api/quote-requests/${id}:`, validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error",
          errors: validationResult.error.errors.map((e: z.ZodIssue) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedId = validationResult.data;

    const quoteRequest = await quoteService.getQuoteRequestById(validatedId);

    if (!quoteRequest) {
      return NextResponse.json({ success: false, message: "Quote Request not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Quote request retrieved successfully.",
      data: quoteRequest,
    });
  } catch (error) {
    logger.error('Error in GET /api/quote-requests/[id]:', error);
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    // 1. Await params as required by Next.js 15+
    const { id } = await params;

    // 2. Manually validate the ID first
    const quoteRequestIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quote Request ID format.');
    const idValidationResult = quoteRequestIdSchema.safeParse(id);

    if (!idValidationResult.success) {
      logger.warn(`Manual ID validation error for PATCH /api/quote-requests/${id}:`, idValidationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error (ID)",
          errors: idValidationResult.error.errors.map((e: z.ZodIssue) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    const validatedId = idValidationResult.data;

    // 3. Read the request body ONCE
    const requestBody = await req.json();

    // 4. Validate the body directly with the schema (not using validateRequest)
    const bodyValidationResult = updateQuoteRequestRequestBodySchema.safeParse(requestBody);

    if (!bodyValidationResult.success) {
      logger.warn('Body validation error for PATCH /api/quote-requests/[id]:', bodyValidationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error (Body)",
          errors: bodyValidationResult.error.errors.map((e: z.ZodIssue) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // 5. Transform validated body to match Partial<IQuoteRequest>
    const validatedBodyFromZod = bodyValidationResult.data;
    const transformedUpdateData: Partial<IQuoteRequest> = {};

    for (const key in validatedBodyFromZod) {
      if (Object.prototype.hasOwnProperty.call(validatedBodyFromZod, key)) {
        const value = (validatedBodyFromZod as any)[key];

        // Handle numeric fields that can be empty strings
        if (
          key === 'proposedPricePerUnit' ||
          key === 'proposedTotalPrice' ||
          key === 'taxRate' ||
          key === 'shippingCost'
        ) {
          if (value === '') {
            (transformedUpdateData as any)[key] = undefined;
          } else if (value !== undefined) {
            (transformedUpdateData as any)[key] = value;
          }
        }
        // Handle other fields
        else if (value !== undefined) {
          (transformedUpdateData as any)[key] = value;
        }
      }
    }

    // 6. Update the quote request
    const updatedQuoteRequest = await quoteService.updateQuoteRequest(validatedId, transformedUpdateData);

    if (!updatedQuoteRequest) {
      return NextResponse.json({ 
        success: false, 
        message: "Quote Request not found or could not be updated." 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Quote request updated successfully.",
      data: updatedQuoteRequest,
    });

  } catch (error) {
    logger.error('Error in PATCH /api/quote-requests/[id]:', error);
    return handleApiError(error);
  }
}