import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import productTypeService from "@/lib/services/productTypeService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import {
  createProductTypeSchema,
  getProductTypeByIdSchema,
  updateProductTypeSchema,
  deleteProductTypeSchema,
} from "@/lib/validators/productTypeValidator";
import logger from "@/lib/config/logger";

export const dynamic = 'force-dynamic';

// GET all product types
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const productTypes = await productTypeService.getAllProductTypes();
    return NextResponse.json({
      success: true,
      message: "Product types retrieved successfully.",
      data: productTypes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create a new product type
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json(); // For JSON body
    const validation = await validateRequest(createProductTypeSchema, req, body);

    if (!validation.success) {
      return validation.errorResponse;
    }

    const { name } = validation.data.body;
    const newProductType = await productTypeService.createProductType(name);

    return NextResponse.json(
      {
        success: true,
        message: "Product type created successfully.",
        data: newProductType,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE a product type by ID (needs to be in its own dynamic route file: [id]/route.ts)
// This will be moved to app/api/product-types/[id]/route.ts
// The logic for DELETE and PUT/PATCH will go there.