// my-leather-platform/app/api/finished-products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import finishedProductService from "@/lib/services/finishedProductService";
import { handleApiError } from "@/lib/utils/errorHandler";
import {
  getFinishedProductByIdSchema,
  updateFinishedProductSchema,
} from "@/lib/validators/finishedProductValidator";
import { validateRequest } from "@/lib/middleware/validateRequest";
import logger from "@/lib/config/logger";
import { parseFormData } from "@/lib/utils/parseFormData";
import cloudinary from "@/lib/config/cloudinary";

export const dynamic = 'force-dynamic';
export const config = {
  api: {
    bodyParser: false,
  },
};

interface ProductParams {
  params: { id: string };
}

// GET single finished product by ID
export async function GET(req: NextRequest, { params }: ProductParams) {
  await connectDB();
  try {
    const validation = await validateRequest(getFinishedProductByIdSchema, req, params); // Pass params directly
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.params;

    const product = await finishedProductService.getProductById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: `Finished product with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Finished product retrieved successfully.",
      data: product,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT update a finished product by ID
export async function PUT(req: NextRequest, { params }: ProductParams) {
  await connectDB();
  try {
    const { id } = params;

    const { fields, files: newFiles } = await parseFormData(req);

    // Validate the text fields and ID
    const validation = await validateRequest(updateFinishedProductSchema, req, { ...fields, id });
    if (!validation.success) {
      return validation.errorResponse;
    }
    const updateData = validation.data.body; // body contains updated fields
    const validatedId = validation.data.params?.id; // params contains validated id

    if (!validatedId) {
      return NextResponse.json(
        { success: false, message: "Product ID is missing." },
        { status: 400 }
      );
    }

    const existingProduct = await finishedProductService.getProductById(validatedId);
    if (!existingProduct) {
        return NextResponse.json(
            { success: false, message: `Finished product with ID ${validatedId} not found.` },
            { status: 404 }
        );
    }

    let updatedImageUrls = existingProduct.images;
    if (newFiles && newFiles.length > 0) {
      const uploadedNewImageUrls: string[] = [];
      for (const fileItem of newFiles) {
        const file = fileItem.file;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const b64 = buffer.toString("base64");
        const dataUri = `data:${file.type};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "finished-products",
          resource_type: "auto",
          quality: "auto:eco",
          fetch_format: "auto",
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        });
        uploadedNewImageUrls.push(result.secure_url);
        logger.info(`Uploaded new image to Cloudinary during update: ${result.secure_url}`);
      }
      updatedImageUrls = [...existingProduct.images, ...uploadedNewImageUrls];
    }

    const updatedProduct = await finishedProductService.updateProduct(validatedId, {
      ...updateData,
      images: updatedImageUrls,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: `Finished product with ID ${validatedId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Finished product updated successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE a finished product by ID
export async function DELETE(req: NextRequest, { params }: ProductParams) {
  await connectDB();
  try {
    const validation = await validateRequest(getFinishedProductByIdSchema, req, params);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.params;

    const isDeleted = await finishedProductService.deleteProduct(id);

    if (!isDeleted) {
      return NextResponse.json(
        { success: false, message: `Finished product with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Finished product deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}