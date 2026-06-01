import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import rawLeatherService from "@/lib/services/rawLeatherService";
import { handleApiError } from "@/lib/utils/errorHandler";
import {
  createRawLeatherSchema,
  getRawLeatherFilterSchema,
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

// GET all leather hides entries
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validation = await validateRequest(getRawLeatherFilterSchema, req, query);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const { query: validatedQueryParams } = validation.data;

    const filters = {
      leatherType: validatedQueryParams.leatherType,
      animal: validatedQueryParams.animal,
      finish: validatedQueryParams.finish,
      color: validatedQueryParams.color,
      search: validatedQueryParams.search,
      isFeatured: validatedQueryParams.isFeatured,
      isArchived: validatedQueryParams.isArchived,
      priceUnit: validatedQueryParams.priceUnit,
      discountAvailable: validatedQueryParams.discountAvailable,
      negotiable: validatedQueryParams.negotiable,
    };

    const page = validatedQueryParams.page;
    const limit = validatedQueryParams.limit;
    const sortBy = validatedQueryParams.sortBy;
    const order = validatedQueryParams.order;

    const { rawLeather, total, page: currentPage, limit: currentLimit } =
      await rawLeatherService.getRawLeather(filters, page, limit, sortBy, order);

    return NextResponse.json({
      success: true,
      message: "Raw leather entries retrieved successfully.",
      data: rawLeather,
      pagination: {
        totalProducts: total,
        currentPage: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create a new leather hides entry
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const formData = await req.formData();

    const fields: Record<string, any> = {};
    const imageFiles: File[] = [];
    let rawPriceTierString: string | undefined; // To capture the stringified priceTier

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'images') {
          imageFiles.push(value);
        }
      } else {
        if (key === 'priceTier') { // Capture priceTier string
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
    
    // Parse priceTier string into an array before passing to Zod
    if (rawPriceTierString !== undefined) { // Check if the key was even present in FormData
      try {
        const parsedTiers = JSON.parse(rawPriceTierString);
        if (Array.isArray(parsedTiers)) {
            fields.priceTier = parsedTiers;
        } else {
            logger.warn(`PriceTier JSON was not an array during POST: ${rawPriceTierString}. Setting to empty array.`);
            fields.priceTier = [];
        }
      } catch (parseError) {
        logger.error(`Error parsing priceTier JSON during POST: ${rawPriceTierString}, Error: ${parseError}. Setting to empty array.`);
        fields.priceTier = [];
      }
    } else {
        // If priceTier key was not sent (e.g. if filteredPriceTiers was empty, nothing appended for 'priceTier'),
        // Zod's .optional().default([]) will handle this, so no need to set fields.priceTier here.
    }


    const validation = await validateRequest(createRawLeatherSchema, req, fields);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const rawLeatherData = validation.data.body;

    const imageUrls: string[] = [];
    if (imageFiles.length === 0) {
        return NextResponse.json(
            { success: false, message: "At least one image is required for a new leather hides entry." },
            { status: 400 }
        );
    }
    for (const file of imageFiles) {
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
      imageUrls.push(result.secure_url);
      logger.info(`Uploaded leather hides image to Cloudinary: ${result.secure_url}`);
    }

    const newRawLeather = await rawLeatherService.createRawLeather({
      ...rawLeatherData,
      images: imageUrls,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Raw leather entry created successfully.",
        data: newRawLeather,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}