import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import rawLeatherTypeService from "@/lib/services/rawLeatherTypeService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import {
  createRawLeatherTypeSchema,
} from "@/lib/validators/rawLeatherTypeValidator";
import logger from "@/lib/config/logger";

export const dynamic = 'force-dynamic';

// GET all leather hides types
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const rawLeatherTypes = await rawLeatherTypeService.getAllRawLeatherTypes();
    return NextResponse.json({
      success: true,
      message: "Raw leather types retrieved successfully.",
      data: rawLeatherTypes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create a new leather hides type
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json(); // For JSON body
    const validation = await validateRequest(createRawLeatherTypeSchema, req, body);

    if (!validation.success) {
      return validation.errorResponse;
    }

    const { name } = validation.data.body;
    const newRawLeatherType = await rawLeatherTypeService.createRawLeatherType(name);

    return NextResponse.json(
      {
        success: true,
        message: "Raw leather type created successfully.",
        data: newRawLeatherType,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}