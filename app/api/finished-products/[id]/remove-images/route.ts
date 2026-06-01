// my-leather-platform/app/api/finished-products/[id]/remove-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import finishedProductService from "@/lib/services/finishedProductService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { removeImagesSchema } from "@/lib/validators/finishedProductValidator";
import { validateRequest } from "@/lib/middleware/validateRequest";
import logger from "@/lib/config/logger";

interface ProductParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: ProductParams) {
  await connectDB();
  try {
    const requestBody = await req.json(); // Expecting JSON body for image URLs
    const validation = await validateRequest(removeImagesSchema, req, { ...requestBody, id: params.id }); // Pass ID to the validation body

    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.params;
    const { imageUrls } = validation.data.body; // imagesUrls comes from body

    const updatedProduct = await finishedProductService.removeProductImages(id, imageUrls);

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: `Finished product with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Images removed successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    return handleApiError(error);
  }
}