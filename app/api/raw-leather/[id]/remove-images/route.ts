// my-leather-platform/app/api/raw-leather/[id]/remove-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import rawLeatherService from "@/lib/services/rawLeatherService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { removeRawLeatherImagesSchema } from "@/lib/validators/rawLeatherValidator";
import { validateRequest } from "@/lib/middleware/validateRequest";
import logger from "@/lib/config/logger";

export const dynamic = 'force-dynamic';

interface RawLeatherParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RawLeatherParams) {
  await connectDB();
  try {
    const requestBody = await req.json(); // Expecting JSON body for image URLs
    // IMPORTANT: Merge params.id into requestBody for validation
    const mergedBodyWithId = { ...requestBody, id: params.id };
    const validation = await validateRequest(removeRawLeatherImagesSchema, req, mergedBodyWithId);

    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.body; // Access id from validated body
    const { imageUrls } = validation.data.body; // Access imageUrls from validated body

    const updatedRawLeather = await rawLeatherService.removeRawLeatherImages(id, imageUrls);

    if (!updatedRawLeather) {
      return NextResponse.json(
        { success: false, message: `Raw leather entry with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Images removed successfully.",
      data: updatedRawLeather,
    });
  } catch (error) {
    return handleApiError(error);
  }
}