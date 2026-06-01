// my-leather-platform/app/api/quote-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import quoteService from '@/lib/services/quoteService';
import { handleApiError } from '@/lib/utils/errorHandler';
import { validateRequest } from "@/lib/middleware/validateRequest";
import { createQuoteRequestCombinedSchema, getQuoteRequestsListCombinedSchema } from '@/lib/validators/quoteValidator';
import logger from '@/lib/config/logger';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// GET all quote requests (for admin dashboard)
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());

    const validation = await validateRequest(getQuoteRequestsListCombinedSchema, req, { query });
    if (!validation.success) {
      logger.warn('Validation error for GET /api/quote-requests:', validation.errorResponse.json());
      return validation.errorResponse;
    }
    const validatedQuery = validation.data.query;

    const filters: any = {};
    if (validatedQuery.status && validatedQuery.status !== 'all') {
      filters.status = validatedQuery.status;
    }
    if (validatedQuery.destinationCountry) {
      filters.destinationCountry = validatedQuery.destinationCountry;
    }
    if (validatedQuery.itemTypeCategory && validatedQuery.itemTypeCategory !== 'all') {
      filters.itemTypeCategory = validatedQuery.itemTypeCategory;
    }
    if (validatedQuery.search) {
      const searchRegex = new RegExp(validatedQuery.search, 'i');
      filters.$or = [
        { customerName: { $regex: searchRegex } },
        { companyName: { $regex: searchRegex } },
        { itemName: { $regex: searchRegex } },
        { requestNumber: { $regex: searchRegex } }, // FIX: Add requestNumber to search
      ];
      if (mongoose.Types.ObjectId.isValid(validatedQuery.search)) {
          filters.$or.push({ _id: new mongoose.Types.ObjectId(validatedQuery.search) });
      }
    }

    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 10;
    const sortBy = validatedQuery.sortBy;
    const order = validatedQuery.order;

    const { requests, total, page: currentPage, limit: currentLimit } =
      await quoteService.getQuoteRequests(filters, page, limit, sortBy, order);

    return NextResponse.json({
      success: true,
      message: "Quote requests retrieved successfully.",
      data: requests,
      pagination: {
        totalProducts: total,
        currentPage: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/quote-requests:', error);
    return handleApiError(error);
  }
}

// POST a new quote request from customer
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const requestBody = await req.json();
    logger.info('Received new quote request payload:', requestBody);

    const validation = await validateRequest(createQuoteRequestCombinedSchema, req, requestBody);
    if (!validation.success) {
      logger.warn('Validation error for POST /api/quote-requests:', validation.errorResponse.json());
      return validation.errorResponse;
    }
    const validatedBody = validation.data.body;

    const newQuoteRequest = await quoteService.createQuoteRequest(validatedBody);

    return NextResponse.json({
      success: true,
      message: "Quote request submitted successfully. We will contact you soon!",
      data: newQuoteRequest,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/quote-requests:', error);
    return handleApiError(error);
  }
}