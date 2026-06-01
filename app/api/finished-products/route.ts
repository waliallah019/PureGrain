import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import finishedProductService from "@/lib/services/finishedProductService";
import { handleApiError } from "@/lib/utils/errorHandler";
import {
  createFinishedProductSchema,
  getFinishedProductsFilterSchema,
} from "@/lib/validators/finishedProductValidator";
import { validateRequest } from "@/lib/middleware/validateRequest";
import logger from "@/lib/config/logger"; // Assuming logger is used for general info, not just errors
import { parseFormData } from "@/lib/utils/parseFormData";
import cloudinary from "@/lib/config/cloudinary";

export const dynamic = 'force-dynamic';
export const config = {
  api: {
    bodyParser: false,
  },
};

// GET all finished products
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const validation = await validateRequest(getFinishedProductsFilterSchema, req);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { query } = validation.data;

    const filters = {
      productType: query.productType,
      color: query.color,
      material: query.material,
      search: query.search,
      category: query.category,
      availability: query.availability,
      isActive: query.isActive,
      isArchived: query.isArchived, // This is crucial and correctly passed
      sampleAvailable: query.sampleAvailable, // Ensure this is also passed
      isFeatured: query.isFeatured, // Filter for featured products
    };

    const page = query.page;
    const limit = query.limit;
    const sortBy = query.sortBy;
    const order = query.order;

    // Pass sortBy and order to the service function
    const { products, total, page: currentPage, limit: currentLimit } =
      await finishedProductService.getProducts(filters, page, limit, sortBy, order);

    return NextResponse.json({
      success: true,
      message: "Finished products retrieved successfully.",
      data: products,
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

// POST create a new finished product (no changes needed here)
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const { fields, files } = await parseFormData(req);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one image is required." },
        { status: 400 }
      );
    }

    const validation = await validateRequest(createFinishedProductSchema, req, fields);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const productData = validation.data.body;

    const imageUrls: string[] = [];
    for (const fileItem of files) {
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
      imageUrls.push(result.secure_url);
      logger.info(`Uploaded image to Cloudinary: ${result.secure_url}`);
    }

    const newProduct = await finishedProductService.createProduct({
      ...productData,
      images: imageUrls,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Finished product created successfully.",
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}