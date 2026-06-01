// my-leather-platform/app/api/messages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import messageService from "@/lib/services/messageService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import { updateMessageStatusSchema, deleteMessageSchema } from "@/lib/validators/contactValidator"; // No longer need idParamSchema if ID is in body
import logger from "@/lib/config/logger";
import { sendEmail } from "@/lib/utils/sendEmail";

export const dynamic = 'force-dynamic';

// GET message by ID (This one is tricky with your validateRequest)
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  await connectDB();
  try {
    const resolvedParams = await context.params;

    // To use validateRequest, we need to mimic its 'parsedBody' structure
    // This is awkward for a GET by ID where ID is typically in params only.
    // The safest way is to NOT use validateRequest here and just validate manually,
    // or slightly adjust validateRequest to handle `params` being its only concern.

    // Given your constraint, we'll manually validate for GET to keep it simple and correct.
    const id = resolvedParams.id;
    if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json({ success: false, message: "Invalid message ID format." }, { status: 400 });
    }

    const message = await messageService.getMessageById(id);
    if (!message) {
      return NextResponse.json({ success: false, message: "Message not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Message retrieved.", data: message });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH message status (and potentially send reply)
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  await connectDB();
  try {
    const resolvedParams = await context.params;
    const requestBody = await req.json(); // Get the original body

    // FIX: Manually merge the 'id' from params into the body before validation
    const mergedBody = { ...requestBody, id: resolvedParams.id };

    // Pass this mergedBody as the 'parsedBody' to validateRequest
    const validation = await validateRequest(updateMessageStatusSchema, req, mergedBody);
    if (!validation.success) {
      return validation.errorResponse;
    }

    // validated.data.body will now contain { id, status, replyText }
    const { id, status, replyText } = validation.data.body;

    console.log("Validated status:", status, "Reply text:", replyText);
    console.log("Validated ID from merged body:", id);

    const updatedMessage = await messageService.updateMessageStatus(id, status); // Use the validated ID

    if (status === 'replied' && replyText && updatedMessage) {
      try {
        await sendEmail({
          to: updatedMessage.customerEmail,
          subject: `Re: ${updatedMessage.subject}`,
          text: replyText,
        });
        logger.info(`Reply email sent to ${updatedMessage.customerEmail} for message ${id}`);
      } catch (emailError) {
        logger.error(`Failed to send reply email for message ${id}: ${emailError}`);
      }
    }

    if (!updatedMessage) {
      return NextResponse.json({ success: false, message: "Message not found for update." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Message status updated to ${status}.`, data: updatedMessage });
  } catch (error) {
    console.error("Backend PATCH caught error:", error);
    return handleApiError(error);
  }
}

// DELETE message
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  await connectDB();
  try {
    const resolvedParams = await context.params;

    // FIX: Manually create a body-like object containing the ID for validateRequest
    const deleteBody = { id: resolvedParams.id };

    // Pass this as the 'parsedBody' to validateRequest
    const validation = await validateRequest(deleteMessageSchema, req, deleteBody);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const id = validation.data.body.id; // Get validated ID from the body-like structure

    const deleted = await messageService.deleteMessage(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Message not found for deletion." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    return handleApiError(error);
  }
}