import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import blogService from "@/lib/services/blogService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import { blogSlugSchema } from "@/lib/validators/blogValidator";

export const dynamic = "force-dynamic";

interface SlugParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: SlugParams) {
  await connectDB();

  try {
    const { slug: routeSlug } = await params;
    const validation = await validateRequest(blogSlugSchema, req, { slug: routeSlug });
    if (!validation.success) {
      return validation.errorResponse;
    }

    const { slug } = validation.data.body;
    const includeDraft = req.nextUrl.searchParams.get("includeDraft") === "true";

    const blog = includeDraft
      ? await blogService.getAnyBlogBySlug(slug)
      : await blogService.getBlogBySlug(slug);

    if (!blog) {
      return NextResponse.json(
        { success: false, message: `Blog post with slug '${slug}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blog post retrieved successfully.",
      data: blog,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
