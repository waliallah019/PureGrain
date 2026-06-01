// C:\Dev\puretemp-main\app\api\notifications\route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import notificationService from "@/lib/services/notificationService";
import { handleApiError } from "@/lib/utils/errorHandler";
// We will manually validate query parameters here, simplifying `validateRequest` usage
// import { validateRequest } from "@/lib/middleware/validateRequest"; // No longer directly used for query
import { notificationQuerySchema } from "@/lib/validators/notificationValidator"; // Use this directly
import logger from "@/lib/config/logger";
import { ZodError } from "zod"; // Import ZodError for explicit error handling

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const rawQueryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    logger.info(`API Route GET: Raw query params: ${JSON.stringify(rawQueryParams)}`);

    // Manually validate query parameters using Zod's safeParse
    const validationResult = notificationQuerySchema.safeParse(rawQueryParams);

    if (!validationResult.success) {
      logger.warn('API Route GET: Query validation error:', validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error",
          errors: validationResult.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedQuery = validationResult.data;
    logger.info(`API Route GET: Validated query data: ${JSON.stringify(validatedQuery)}`);

    const filters: any = {};

    // Apply filters based on validated query
    if (validatedQuery.read !== undefined && validatedQuery.read !== null) {
      filters.read = validatedQuery.read;
      logger.info(`API Route GET: Filter object will include read: ${filters.read}`);
    } else {
      logger.info(`API Route GET: No 'read' filter specified in validated query.`);
    }

    if (validatedQuery.type && validatedQuery.type !== 'all') {
      filters.type = validatedQuery.type;
    }
    if (validatedQuery.search) {
      filters.$or = [
        { title: { $regex: validatedQuery.search, $options: 'i' } },
        { message: { $regex: validatedQuery.search, $options: 'i' } },
      ];
    }

    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const sortBy = validatedQuery.sortBy;
    const order = validatedQuery.order;

    const { notifications, total, page: currentPage, limit: currentLimit } =
      await notificationService.getNotifications(filters, page, limit, sortBy, order);

    return NextResponse.json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: notifications,
      pagination: {
        totalProducts: total,
        currentPage: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/notifications:', error);
    if (error instanceof ZodError) { // Catch Zod errors if any slip through
      return NextResponse.json(
        { success: false, message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

// PATCH to mark all notifications as read (NO CHANGE)
export async function PATCH(req: NextRequest) {
  await connectDB();
  try {
    await notificationService.markAllAsRead();
    return NextResponse.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    logger.error('Error in PATCH /api/notifications (mark all read):', error);
    return handleApiError(error);
  }
}