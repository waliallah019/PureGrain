import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import blogService from "@/lib/services/blogService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import { blogFiltersSchema, createBlogSchema } from "@/lib/validators/blogValidator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const validation = await validateRequest(blogFiltersSchema, req, query);

    if (!validation.success) {
      return validation.errorResponse;
    }

    const { page, limit, search, status, includeDraft, sortBy, order } = validation.data.query;

    const { blogs, total, page: currentPage, limit: currentLimit } = await blogService.getBlogs(
      {
        search,
        status,
        includeDraft,
      },
      page,
      limit,
      sortBy,
      order
    );

    return NextResponse.json({
      success: true,
      message: "Blog posts retrieved successfully.",
      data: blogs,
      pagination: {
        totalPosts: total,
        currentPage,
        totalPages: Math.ceil(total / currentLimit),
        limit: currentLimit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const validation = await validateRequest(createBlogSchema, req, body);

    if (!validation.success) {
      return validation.errorResponse;
    }

    const blogData = validation.data.body;
    const uniqueSlug = await blogService.ensureUniqueSlug(blogData.slug);

    const created = await blogService.createBlog({
      ...blogData,
      slug: uniqueSlug,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Blog post created successfully.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
