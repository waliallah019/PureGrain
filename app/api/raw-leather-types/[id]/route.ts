import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import rawLeatherTypeService from "@/lib/services/rawLeatherTypeService";
// FIX: Correct the import syntax for handleApiError
import { handleApiError } from "@/lib/utils/errorHandler"; // Changed `=>` to `from`
import { validateRequest } from "@/lib/middleware/validateRequest";
import {
  getRawLeatherTypeByIdSchema,
  updateRawLeatherTypeSchema,
  deleteRawLeatherTypeSchema,
} from "@/lib/validators/rawLeatherTypeValidator";
import logger from "@/lib/config/logger";

export const dynamic = 'force-dynamic';

interface RawLeatherTypeRouteParams {
  params: { id: string };
}

// GET a single raw leather type by ID
export async function GET(req: NextRequest, { params }: RawLeatherTypeRouteParams) {
  const rawLeatherTypeId = params.id;
  await connectDB();
  try {
    const validation = await validateRequest(getRawLeatherTypeByIdSchema, req, { id: rawLeatherTypeId });
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.body;

    const rawLeatherType = await rawLeatherTypeService.getRawLeatherTypeById(id);
    if (!rawLeatherType) {
      return NextResponse.json(
        { success: false, message: "Raw leather type not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raw leather type retrieved successfully.",
      data: rawLeatherType,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT/PATCH update a raw leather type by ID
export async function PUT(req: NextRequest, { params }: RawLeatherTypeRouteParams) {
  const rawLeatherTypeId = params.id;
  await connectDB();
  try {
    const body = await req.json();
    const mergedBodyWithId = { ...body, id: rawLeatherTypeId }; // Merge ID into body
    const validation = await validateRequest(updateRawLeatherTypeSchema, req, mergedBodyWithId);

    if (!validation.success) {
      return validation.errorResponse;
    }

    const { id, name } = validation.data.body; // Extract id from validated body

    const updatedRawLeatherType = await rawLeatherTypeService.updateRawLeatherType(id, name);
    if (!updatedRawLeatherType) {
      return NextResponse.json(
        { success: false, message: "Raw leather type not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raw leather type updated successfully.",
      data: updatedRawLeatherType,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE a raw leather type by ID
export async function DELETE(req: NextRequest, { params }: RawLeatherTypeRouteParams) {
  const rawLeatherTypeId = params.id;
  await connectDB();
  try {
    const validation = await validateRequest(deleteRawLeatherTypeSchema, req, { id: rawLeatherTypeId });
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { id } = validation.data.body;

    const deleted = await rawLeatherTypeService.deleteRawLeatherType(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Raw leather type not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raw leather type deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}