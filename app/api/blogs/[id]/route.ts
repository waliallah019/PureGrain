import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import blogService from "@/lib/services/blogService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import { blogIdSchema, updateBlogSchema } from "@/lib/validators/blogValidator";

export const dynamic = "force-dynamic";

interface BlogParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: BlogParams) {
  await connectDB();

  try {
    const validation = await validateRequest(blogIdSchema, req, { id: params.id });
    if (!validation.success) {
      return validation.errorResponse;
    }

    const { id } = validation.data.body;
    const blog = await blogService.getBlogById(id);

    if (!blog) {
      return NextResponse.json(
        { success: false, message: `Blog post with ID ${id} not found.` },
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

export async function PUT(req: NextRequest, { params }: BlogParams) {
  await connectDB();

  try {
    const idValidation = await validateRequest(blogIdSchema, req, { id: params.id });
    if (!idValidation.success) {
      return idValidation.errorResponse;
    }

    const body = await req.json();
    const updateValidation = await validateRequest(updateBlogSchema, req, body);
    if (!updateValidation.success) {
      return updateValidation.errorResponse;
    }

    const { id } = idValidation.data.body;
    const payload = updateValidation.data.body;

    const nextSlug = payload.slug || payload.title;
    const uniqueSlug = nextSlug ? await blogService.ensureUniqueSlug(nextSlug, id) : undefined;

    const updated = await blogService.updateBlog(id, {
      ...payload,
      ...(uniqueSlug ? { slug: uniqueSlug } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: `Blog post with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blog post updated successfully.",
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: BlogParams) {
  await connectDB();

  try {
    const validation = await validateRequest(blogIdSchema, req, { id: params.id });
    if (!validation.success) {
      return validation.errorResponse;
    }

    const { id } = validation.data.body;
    const deleted = await blogService.deleteBlog(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Blog post with ID ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
