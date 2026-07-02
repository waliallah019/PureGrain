// my-leather-platform/app/api/custom-manufacturing/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import customManufacturingService from "@/lib/services/customManufacturingService";
import { handleApiError } from "@/lib/utils/errorHandler";
import {
  createCustomManufacturingRequestSchema,
  getCustomManufacturingRequestFilterSchema,
} from "@/lib/validators/customManufacturingValidator";
import { validateRequest } from "@/lib/middleware/validateRequest";
import logger from "@/lib/config/logger";
import cloudinary from "@/lib/config/cloudinary"; // For file uploads

export const dynamic = 'force-dynamic';
export const config = {
  api: {
    bodyParser: false, // REQUIRED for file uploads
  },
};

// GET all custom manufacturing requests (for admin side)
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validation = await validateRequest(getCustomManufacturingRequestFilterSchema, req, query);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { query: validatedQueryParams } = validation.data;

    const filters = {
      status: validatedQueryParams.status,
      search: validatedQueryParams.search,
    };
    const page = validatedQueryParams.page;
    const limit = validatedQueryParams.limit;
    const sortBy = validatedQueryParams.sortBy;
    const order = validatedQueryParams.order;

    const { requests, total, page: currentPage, limit: currentLimit } =
      await customManufacturingService.getRequests(filters, page, limit, sortBy, order);

    return NextResponse.json({
      success: true,
      message: "Custom manufacturing requests retrieved successfully.",
      data: requests,
      pagination: {
        totalProducts: total, // Using totalProducts for pagination consistency
        currentPage: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create a new custom manufacturing request (customer submission)
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const formData = await req.formData();

    const fields: Record<string, any> = {};
    const designFiles: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === 'designFiles') { // Assuming file input name is 'designFiles'
          designFiles.push(value);
        }
      } else {
        // Collect other form fields
        if (key.endsWith('[]')) { // For array-like fields if any are sent
          const baseKey = key.slice(0, -2);
          if (!fields[baseKey]) fields[baseKey] = [];
          (fields[baseKey] as string[]).push(value as string);
        } else {
          fields[key] = value;
        }
      }
    }

    const validation = await validateRequest(createCustomManufacturingRequestSchema, req, fields);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const requestData = validation.data.body;

    // Business rule: at least one of `specifications` or a design file must
    // be provided. Enforced server-side as well as client-side because
    // anyone can bypass the browser validation.
    const hasSpecs = (requestData.specifications || "").trim().length > 0;
    if (!hasSpecs && designFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please describe your specifications OR upload at least one design file.",
          errors: [
            {
              path: "specifications",
              message:
                "Please describe your specifications OR upload at least one design file.",
            },
            {
              path: "designFiles",
              message:
                "Please upload at least one design file OR describe your specifications.",
            },
          ],
        },
        { status: 400 }
      );
    }

    // File policy mirrors the client-side limits — but enforced here so it
    // can't be bypassed by crafting a custom multipart request.
    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
    const MAX_TOTAL_FILES = 5;
    const ALLOWED_MIMETYPES = new Set<string>([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/x-adobe-ai",
      "application/postscript",
      "image/vnd.adobe.photoshop",
      "image/psd",
      "application/dxf",
      "application/x-autocad",
      "application/vnd.oasis.opendocument.text",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    if (designFiles.length > MAX_TOTAL_FILES) {
      return NextResponse.json(
        {
          success: false,
          message: `A maximum of ${MAX_TOTAL_FILES} design files can be uploaded.`,
        },
        { status: 400 }
      );
    }

    for (const file of designFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            message: `File '${file.name}' exceeds the 25MB upload limit.`,
          },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIMETYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: `File '${file.name}' has an unsupported format. Allowed: PDF, JPG, PNG, GIF, AI, PSD, DWG, DOC/DOCX.`,
          },
          { status: 400 }
        );
      }
    }

    const designFileUrls: string[] = [];
    if (designFiles.length > 0) {
      for (const file of designFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const b64 = buffer.toString("base64");
        const dataUri = `data:${file.type};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "custom-manufacturing-designs", // Dedicated Cloudinary folder
          resource_type: "auto",
          quality: "auto:eco",
          fetch_format: "auto",
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        });
        designFileUrls.push(result.secure_url);
        logger.info(`Uploaded design file to Cloudinary: ${result.secure_url}`);
      }
    }

    const newRequest = await customManufacturingService.createRequest({
      ...requestData,
      designFiles: designFileUrls,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your custom manufacturing request has been submitted successfully.",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}