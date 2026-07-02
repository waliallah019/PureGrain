// my-leather-platform/app/api/custom-manufacturing/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from "@/lib/config/db";
import customManufacturingService from '@/lib/services/customManufacturingService';
import { updateCustomManufacturingRequestSchema } from '@/lib/validators/customManufacturingValidator';
import { handleApiError } from '@/lib/utils/errorHandler';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

// Schema for the URL :id parameter
const idParamSchema = z
  .string()
  .length(24, 'Invalid request ID format.')
  .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), 'Invalid request ID format.');

// Body schema for PUT: same as updateCustomManufacturingRequestSchema's body,
// but without the legacy `id` field (we use the URL :id instead) and with
// strict() so unknown fields are rejected to prevent mass-assignment.
const updateBodySchema = updateCustomManufacturingRequestSchema.shape.body
  .omit({ id: true })
  .strict();

// GET handler for fetching a single request by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  try {
    const idValidation = idParamSchema.safeParse(params?.id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error (ID)',
          errors: idValidation.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    const id = idValidation.data;

    const request = await customManufacturingService.getRequestById(id);

    if (!request) {
      return NextResponse.json({ success: false, message: 'Custom manufacturing request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    logger.error('Error fetching custom manufacturing request:', error);
    return handleApiError(error);
  }
}

// PUT handler for updating a request by ID (e.g., status update)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  try {
    const idValidation = idParamSchema.safeParse(params?.id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error (ID)',
          errors: idValidation.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    const id = idValidation.data;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body.' },
        { status: 400 }
      );
    }

    const bodyValidation = updateBodySchema.safeParse(rawBody);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error (Body)',
          errors: bodyValidation.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const updatedRequest = await customManufacturingService.updateRequest(id, bodyValidation.data);

    if (!updatedRequest) {
      return NextResponse.json({ success: false, message: 'Custom manufacturing request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error) {
    logger.error('Error updating custom manufacturing request:', error);
    return handleApiError(error);
  }
}

// DELETE handler for deleting a request by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  try {
    const idValidation = idParamSchema.safeParse(params?.id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error (ID)',
          errors: idValidation.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    const id = idValidation.data;

    const deletedRequest = await customManufacturingService.deleteRequest(id);

    if (!deletedRequest) {
      return NextResponse.json({ success: false, message: 'Custom manufacturing request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Custom manufacturing request deleted' });
  } catch (error) {
    logger.error('Error deleting custom manufacturing request:', error);
    return handleApiError(error);
  }
}