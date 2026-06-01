import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import notificationService from "@/lib/services/notificationService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest"; // Your unchanged validator
// Import individual schemas and Zod for manual validation
import { notificationUpdateBodySchema, notificationIdParamSchema } from "@/lib/validators/notificationValidator";
import logger from "@/lib/config/logger";
import { z } from "zod"; // Import Zod for manual validation

export const dynamic = 'force-dynamic';

// PATCH notification status (e.g., mark as read/unread)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { // Destructure params
  await connectDB();
  try {
    const { id } = params;

    // 1. Manually validate the ID first (due to validateRequest's internal param derivation limitations)
    const idValidationResult = notificationIdParamSchema.safeParse({ id }); // Validate as object { id: '...' }

    if (!idValidationResult.success) {
        logger.warn(`Manual ID validation error for PATCH /api/notifications/${id}:`, idValidationResult.error.errors);
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
    const validatedId = idValidationResult.data.id; // Get the validated ID string

    // 2. Read the request body
    const requestBody = await req.json();

    // 3. Use validateRequest to validate *only* the body, using its uncombined schema.
    // validateRequest will put this into `dataToValidate.body`.
    // So, validated data will be `validation.data` (after .body access).
    const bodyValidation = await validateRequest(notificationUpdateBodySchema, req, requestBody); // Pass body directly

    if (!bodyValidation.success) {
      logger.warn("Validation error for PATCH /api/notifications/[id] (Body):", bodyValidation.errorResponse.json());
      return bodyValidation.errorResponse;
    }

    const { read } = bodyValidation.data; // Access 'read' directly from validated data

    const updatedNotification = await notificationService.updateNotificationStatus(validatedId, read);

    if (!updatedNotification) {
      return NextResponse.json({ success: false, message: "Notification not found for update." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Notification marked as ${read ? 'read' : 'unread'}.`, data: updatedNotification });
  } catch (error) {
    logger.error("Backend PATCH /api/notifications/[id] caught error:", error);
    return handleApiError(error);
  }
}

// DELETE notification
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { // Destructure params
  await connectDB();
  try {
    const { id } = params;

    // 1. Manually validate the ID (completely bypass validateRequest here for params)
    const idValidationResult = notificationIdParamSchema.safeParse({ id }); // Validate as object { id: '...' }

    if (!idValidationResult.success) {
      logger.warn(`Manual ID validation error for DELETE /api/notifications/${id}:`, idValidationResult.error.errors);
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
    const validatedId = idValidationResult.data.id; // Get the validated ID string

    const deleted = await notificationService.deleteNotification(validatedId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Notification not found for deletion." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    logger.error("Backend DELETE /api/notifications/[id] caught error:", error);
    return handleApiError(error);
  }
}