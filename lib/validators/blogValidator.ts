import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const baseBlogSchema = {
  title: z.string().trim().min(5, "Title must be at least 5 characters long."),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters long.")
    .regex(slugRegex, "Slug can only contain lowercase letters, numbers, and hyphens."),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters long."),
  content: z.string().trim().min(40, "Content must be at least 40 characters long."),
  coverImage: z.string().trim().url("Cover image must be a valid URL.").optional(),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  authorName: z.string().trim().min(2).optional().default("Pure Grain Team"),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(160).optional(),
  publishedAt: z.coerce.date().optional(),
};

export const createBlogSchema = z.object({
  body: z.object(baseBlogSchema),
});

export const updateBlogSchema = z.object({
  body: z
    .object({
      ...baseBlogSchema,
      title: baseBlogSchema.title.optional(),
      slug: baseBlogSchema.slug.optional(),
      excerpt: baseBlogSchema.excerpt.optional(),
      content: baseBlogSchema.content.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update the blog post.",
    }),
});

export const blogFiltersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional().default("1"),
    limit: z.string().transform(Number).optional().default("9"),
    search: z.string().trim().optional(),
    status: z.enum(["draft", "published"]).optional(),
    includeDraft: z.preprocess(
      (val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      },
      z.boolean().optional()
    ),
    sortBy: z.enum(["createdAt", "updatedAt", "publishedAt", "title"]).optional().default("publishedAt"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const blogIdSchema = z.object({
  body: z.object({
    id: z
      .string()
      .length(24, "Invalid blog ID format.")
      .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid blog ID format."),
  }),
});

export const blogSlugSchema = z.object({
  body: z.object({
    slug: z
      .string()
      .trim()
      .min(3, "Slug must be at least 3 characters long.")
      .regex(slugRegex, "Invalid slug format."),
  }),
});
