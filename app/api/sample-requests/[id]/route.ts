// C:\Dev\puretemp-main\app\api\sample-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import { ISampleRequest, PaymentStatus } from "@/lib/models/sampleRequestModel";
import sampleService from "@/lib/services/sampleService";
import { handleApiError } from "@/lib/utils/errorHandler";
// import { validateRequest } from "@/lib/middleware/validateRequest"; // No longer used for [id] routes
import {
  updateSampleRequestAdminSchema, // Still need this for its body schema shape
  IdParamSchema, // Use this for explicit ID validation
} from "@/lib/validators/sampleRequestValidator";
import logger from "@/lib/config/logger";
import { z, ZodError } from "zod";

export const dynamic = 'force-dynamic';

// GET a single sample request by ID
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  await connectDB();
  const { id } = context.params;
  logger.info(`[GET] /api/sample-requests/${id} - Request received.`);

  try {
    const paramValidation = IdParamSchema.safeParse({ id });
    if (!paramValidation.success) {
      logger.warn(`[GET] /api/sample-requests/${id} - ID Validation Failed:`, paramValidation.error.errors);
      return NextResponse.json(
        { success: false, message: "Invalid Sample Request ID format.", errors: paramValidation.error.errors },
        { status: 400 }
      );
    }
    // 'id' is now guaranteed to be a valid string ID
    logger.info(`[GET] /api/sample-requests/${id} - Valid ID.`);

    const request = await sampleService.getSampleRequestById(id);

    if (!request) {
      logger.warn(`[GET] /api/sample-requests/${id} - Sample request not found.`);
      return NextResponse.json({ success: false, message: "Sample request not found." }, { status: 404 });
    }

    logger.info(`[GET] /api/sample-requests/${id} - Sample request retrieved successfully.`);
    return NextResponse.json({ success: true, message: "Sample request retrieved successfully.", data: request });
  } catch (error) {
    logger.error(`[GET] /api/sample-requests/${id} - Error:`, error);
    return handleApiError(error);
  }
}

// PATCH to update sample request status or add tracking link (Admin action)
export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  await connectDB();
  const { id } = context.params;
  logger.info(`[PATCH] /api/sample-requests/${id} - Request received.`);

  try {
    // 1. Validate ID parameter explicitly and directly (most reliable)
    const paramValidation = IdParamSchema.safeParse({ id });
    if (!paramValidation.success) {
      logger.warn(`[PATCH] /api/sample-requests/${id} - ID Validation Failed:`, paramValidation.error.errors);
      return NextResponse.json(
        { success: false, message: "Invalid Sample Request ID format.", errors: paramValidation.error.errors },
        { status: 400 }
      );
    }
    // 'id' is now guaranteed to be a valid string ID
    logger.info(`[PATCH] /api/sample-requests/${id} - Valid ID: ${id}`);

    let requestBody: any;
    try {
      // 2. Read the request body ONCE and directly
      requestBody = await req.json();
      logger.info(`[PATCH] /api/sample-requests/${id} - Parsed request body:`, requestBody);
    } catch (jsonError: any) {
      logger.error(`[PATCH] /api/sample-requests/${id} - Failed to parse JSON body:`, jsonError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    // 3. Directly validate the request body using Zod's .shape.body
    // updateSampleRequestAdminSchema is z.object({ body: updateSampleRequestAdminBodySchema })
    // So we use updateSampleRequestAdminSchema.shape.body to get the actual body schema.
    const bodyValidation = updateSampleRequestAdminSchema.shape.body.safeParse(requestBody);

    if (!bodyValidation.success) {
      logger.warn(`[PATCH] /api/sample-requests/${id} - Body Validation Failed. Errors:`, bodyValidation.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error (Body)",
          errors: bodyValidation.error.errors.map((e: z.ZodIssue) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // 4. Extract validated body data
    const { status, shippingTrackingLink } = bodyValidation.data;
    logger.info(`[PATCH] /api/sample-requests/${id} - Validated status: ${status}, trackingLink: ${shippingTrackingLink}`);

    const updateFields: Partial<ISampleRequest> = { paymentStatus: status };
    // Ensure `shippingTrackingLink` is correctly handled for optional values (empty string vs undefined)
    if (shippingTrackingLink !== undefined) {
      updateFields.shippingTrackingLink = shippingTrackingLink;
    }

    const updatedRequest = await sampleService.updateSampleRequest(id, updateFields);

    if (!updatedRequest) {
      logger.warn(`[PATCH] /api/sample-requests/${id} - Sample request not found or could not be updated by service.`);
      return NextResponse.json({ success: false, message: "Sample request not found or could not be updated." }, { status: 404 });
    }

    logger.info(`[PATCH] /api/sample-requests/${id} - Sample request status updated to ${status}.`);
    return NextResponse.json({ success: true, message: `Sample request status updated to ${status}.`, data: updatedRequest });
  } catch (error: any) {
    logger.error(`[PATCH] /api/sample-requests/${id} - Catch block Error:`, error);
    return handleApiError(error);
  }
}

// DELETE a sample request
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  await connectDB();
  const { id } = context.params;
  logger.info(`[DELETE] /api/sample-requests/${id} - Request received.`);

  try {
    // 1. Validate ID parameter explicitly and directly
    const paramValidation = IdParamSchema.safeParse({ id });
    if (!paramValidation.success) {
      logger.warn(`[DELETE] /api/sample-requests/${id} - ID Validation Failed:`, paramValidation.error.errors);
      return NextResponse.json(
        { success: false, message: "Invalid Sample Request ID format.", errors: paramValidation.error.errors },
        { status: 400 }
      );
    }
    // 'id' is now guaranteed to be a valid string ID
    logger.info(`[DELETE] /api/sample-requests/${id} - Valid ID: ${id}`);

    // No body or query validation needed for DELETE (as per current schema)
    const deleted = await sampleService.deleteSampleRequest(id);

    if (!deleted) {
      logger.warn(`[DELETE] /api/sample-requests/${id} - Sample request not found for deletion by service.`);
      return NextResponse.json({ success: false, message: "Sample request not found for deletion." }, { status: 404 });
    }

    logger.info(`[DELETE] /api/sample-requests/${id} - Sample request deleted successfully.`);
    return NextResponse.json({ success: true, message: "Sample request deleted successfully." });
  } catch (error: any) {
    logger.error(`[DELETE] /api/sample-requests/${id} - Catch block Error:`, error);
    return handleApiError(error);
  }
}