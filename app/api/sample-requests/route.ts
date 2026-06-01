// C:\Dev\puretemp-main\app\api\sample-requests\route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import { ISampleRequest } from '@/lib/models/sampleRequestModel';
import sampleService from '@/lib/services/sampleService';
import { handleApiError } from '@/lib/utils/errorHandler';
import { validateRequest } from "@/lib/middleware/validateRequest";
import { createSampleRequestSchema, getSampleRequestListFilterSchema } from '@/lib/validators/sampleRequestValidator';
import logger from '@/lib/config/logger';

export const dynamic = 'force-dynamic';

// GET all sample requests (for admin dashboard)
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());

    // NOTE: validateRequest here will use its internal 'query' and ignore its internal 'params'
    const validation = await validateRequest(getSampleRequestListFilterSchema, req, { query });
    if (!validation.success) {
      logger.warn('Validation error for GET /api/sample-requests. Check validateRequest.ts logs for details.');
      return validation.errorResponse;
    }
    const validatedQuery = validation.data.query;

    const { requests, total, page, limit } =
      await sampleService.getSampleRequests(validatedQuery, validatedQuery.page, validatedQuery.limit, validatedQuery.sortBy, validatedQuery.order);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      message: "Sample requests retrieved successfully.",
      data: requests,
      pagination: {
        totalProducts: total,
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/sample-requests:', error);
    return handleApiError(error);
  }
}

// POST to create a new sample request (after successful payment)
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const requestBody = await req.json();
    logger.info('Received sample request submission payload:', requestBody);

    // NOTE: validateRequest here will use 'requestBody' as its 'parsedBody' and ignore its internal 'params'
    const validation = await validateRequest(createSampleRequestSchema, req, requestBody);
    if (!validation.success) {
      logger.warn('Validation error for POST /api/sample-requests. Check validateRequest.ts logs for details.');
      return validation.errorResponse;
    }
    const validatedBody = validation.data.body;

    const cleanedData: Partial<ISampleRequest> = {};
    Object.entries(validatedBody).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        (cleanedData as any)[key] = value;
      }
    });

    const savedRequest = await sampleService.createSampleRequest(cleanedData);

    return NextResponse.json({
      success: true,
      message: "Sample request created successfully.",
      data: savedRequest
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating sample request:', error);
    return handleApiError(error);
  }
}