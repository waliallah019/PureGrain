// my-leather-platform/app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import messageService from "@/lib/services/messageService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import { getAdminListFilterSchema } from "@/lib/validators/contactValidator"; // Re-use general filter schema
import logger from "@/lib/config/logger";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const validation = await validateRequest(getAdminListFilterSchema, req, query);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { query: validatedQuery } = validation.data;

    const filters = {
      status: validatedQuery.status,
      priority: validatedQuery.priority,
      category: validatedQuery.category, // In service, this maps to inquiryType
      search: validatedQuery.search,
    };
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const sortBy = validatedQuery.sortBy;
    const order = validatedQuery.order;

    const { messages, total, page: currentPage, limit: currentLimit } =
      await messageService.getMessages(filters, page, limit, sortBy, order);

    return NextResponse.json({
      success: true,
      message: "Messages retrieved successfully.",
      data: messages, // Frontend expects 'data' for the list
      pagination: {
        totalProducts: total, // Using totalProducts for consistency with other lists
        currentPage: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}