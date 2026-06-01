import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import rawLeatherService from "@/lib/services/rawLeatherService";
import { handleApiError } from "@/lib/utils/errorHandler";
import {
  getRawLeatherByIdSchema,
  updateRawLeatherSchema,
} from "@/lib/validators/rawLeatherValidator";
import { validateRequest } from "@/lib/middleware/validateRequest";
import logger from "@/lib/config/logger";
import cloudinary from "@/lib/config/cloudinary";

export const dynamic = 'force-dynamic';
export const config = {
  api: {
    bodyParser: false,
  },
};

interface RawLeatherParams {
  params: { id: string };
}

// GET single raw leather entry by ID
export async function GET(req: NextRequest, { params }: RawLeatherParams) {
  // Use a local variable for params.id to satisfy Next.js's static analysis
  const rawLeatherId = params.id;
  await connectDB();
  try {
    // --- WORKAROUND START: Manually merge ID into parsedBody ---
    const validation = await validateRequest(getRawLeatherByIdSchema, req, { id: rawLeatherId });
    // --- WORKAROUND END ---
    if (!validation.success) {
      return validation.errorResponse;
    }
    // Now access id from validated body, as schema expects it there
    const { id } = validation.data.body; 

    const rawLeather = await rawLeatherService.getRawLeatherById(id);

    if (!rawLeather) {
      return NextResponse.json(
        { success: false, message: `Raw leather entry with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raw leather entry retrieved successfully.",
      data: rawLeather,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT update a raw leather entry by ID
export async function PUT(req: NextRequest, { params }: RawLeatherParams) {
  // Use a local variable for params.id to satisfy Next.js's static analysis
  const rawLeatherId = params.id;
  await connectDB();
  try {
    const formData = await req.formData();
    const fields: Record<string, any> = {};
    const newImageFiles: File[] = [];
    let rawPriceTierString: string | undefined;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'images' || key === 'newImages') {
          newImageFiles.push(value);
        }
      } else {
        if (key === 'priceTier') {
          rawPriceTierString = value as string;
        } else if (key.endsWith('[]')) {
          const baseKey = key.slice(0, -2);
          if (!fields[baseKey]) {
            fields[baseKey] = [];
          }
          (fields[baseKey] as string[]).push(value as string);
        } else {
          if (typeof value === 'string' && (value === 'true' || value === 'false')) {
              fields[key] = value === 'true';
          } else {
              fields[key] = value;
          }
        }
      }
    }

    if (rawPriceTierString !== undefined) {
      try {
        const parsedTiers = JSON.parse(rawPriceTierString);
        if (Array.isArray(parsedTiers)) {
            fields.priceTier = parsedTiers;
        } else {
            logger.warn(`PriceTier JSON was not an array during PUT: ${rawPriceTierString}. Setting to empty array.`);
            fields.priceTier = [];
        }
      } catch (parseError) {
        logger.error(`Error parsing priceTier JSON during PUT: ${rawPriceTierString}, Error: ${parseError}. Setting to empty array.`);
        fields.priceTier = [];
      }
    }
    
    // --- WORKAROUND START: Manually merge ID into parsedBody ---
    const mergedFieldsWithId = { ...fields, id: rawLeatherId };
    const validation = await validateRequest(updateRawLeatherSchema, req, mergedFieldsWithId);
    // --- WORKAROUND END ---
    if (!validation.success) {
      return validation.errorResponse;
    }
    // Now access updateData from validated body, and validatedId from validated body as well
    const updateData = validation.data.body; 
    const validatedId = updateData.id; 

    if (!validatedId) {
      return NextResponse.json(
        { success: false, message: "Raw leather ID is missing or invalid." },
        { status: 400 }
      );
    }

    const existingRawLeather = await rawLeatherService.getRawLeatherById(validatedId);
    if (!existingRawLeather) {
        return NextResponse.json(
            { success: false, message: `Raw leather entry with ID ${validatedId} not found.` },
            { status: 404 }
        );
    }

    let updatedImageUrls = existingRawLeather.images;
    if (newImageFiles.length > 0) {
      const uploadedNewImageUrls: string[] = [];
      for (const file of newImageFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const b64 = buffer.toString("base64");
        const dataUri = `data:${file.type};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "raw-leather",
          resource_type: "auto",
          quality: "auto:eco",
          fetch_format: "auto",
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        });
        uploadedNewImageUrls.push(result.secure_url);
        logger.info(`Uploaded new raw leather image during update: ${result.secure_url}`);
      }
      updatedImageUrls = [...existingRawLeather.images, ...uploadedNewImageUrls];
    }

    // Exclude the 'id' field from updateData that is passed to service (as service expects ID as first arg)
    const { id: _, ...restUpdateData } = updateData;

    const updatedRawLeather = await rawLeatherService.updateRawLeather(validatedId, {
      ...restUpdateData,
      images: updatedImageUrls,
    });

    if (!updatedRawLeather) {
      return NextResponse.json(
        { success: false, message: `Raw leather entry with ID ${validatedId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raw leather entry updated successfully.",
      data: updatedRawLeather,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE a raw leather entry by ID
export async function DELETE(req: NextRequest, { params }: RawLeatherParams) {
  // Use a local variable for params.id to satisfy Next.js's static analysis
  const rawLeatherId = params.id;
  await connectDB();
  try {
    // --- WORKAROUND START: Manually merge ID into parsedBody ---
    const validation = await validateRequest(getRawLeatherByIdSchema, req, { id: rawLeatherId });
    // --- WORKAROUND END ---
    if (!validation.success) {
      return validation.errorResponse;
    }
    // Access id from validated body, as schema expects it there
    const { id } = validation.data.body; 

    const isDeleted = await rawLeatherService.deleteRawLeather(id);

    if (!isDeleted) {
      return NextResponse.json(
        { success: false, message: `Raw leather entry with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Raw leather entry deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}