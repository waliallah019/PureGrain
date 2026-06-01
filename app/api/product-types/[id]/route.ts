import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import productTypeService from "@/lib/services/productTypeService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import {
  getProductTypeByIdSchema,
  updateProductTypeSchema,
  deleteProductTypeSchema,
} from "@/lib/validators/productTypeValidator";
import logger from "@/lib/config/logger";

export const dynamic = 'force-dynamic';

interface ProductTypeRouteParams {
  params: { id: string };
}

// GET a single product type by ID
export async function GET(req: NextRequest, { params }: ProductTypeRouteParams) {
  await connectDB();
  try {
    // FIX: Pass params within the parsedBody object as the third argument
    const validation = await validateRequest(getProductTypeByIdSchema, req, { params });
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.params;

    const productType = await productTypeService.getProductTypeById(id);
    if (!productType) {
      return NextResponse.json(
        { success: false, message: "Product type not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product type retrieved successfully.",
      data: productType,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT/PATCH update a product type by ID
export async function PUT(req: NextRequest, { params }: ProductTypeRouteParams) {
  await connectDB();
  try {
    const body = await req.json();
    // FIX: Pass params within the parsedBody object, merging with the actual body
    const validation = await validateRequest(updateProductTypeSchema, req, { body, params });

    if (!validation.success) {
      return validation.errorResponse;
    }

    const { id } = validation.data.params;
    const { name } = validation.data.body;

    const updatedProductType = await productTypeService.updateProductType(id, name);
    if (!updatedProductType) {
      return NextResponse.json(
        { success: false, message: "Product type not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product type updated successfully.",
      data: updatedProductType,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE a product type by ID
export async function DELETE(req: NextRequest, { params }: ProductTypeRouteParams) {
  await connectDB();
  try {
    // FIX: Pass params within the parsedBody object
    const validation = await validateRequest(deleteProductTypeSchema, req, { params });
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.params;

    const deleted = await productTypeService.deleteProductType(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Product type not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product type deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}