import Blog, { IBlog } from "@/lib/models/Blog";
import logger from "@/lib/config/logger";

interface BlogFilters {
  search?: string;
  status?: "draft" | "published";
  includeDraft?: boolean;
}

interface BlogListResult {
  blogs: IBlog[];
  total: number;
  page: number;
  limit: number;
}

class BlogService {
  private calculateReadingTimeMinutes(htmlContent: string): number {
    const words = htmlContent.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  public async ensureUniqueSlug(desiredSlug: string, excludingId?: string): Promise<string> {
    const base = this.normalizeSlug(desiredSlug);
    let slug = base;
    let attempt = 1;

    while (true) {
      const existing = await Blog.findOne({
        slug,
        ...(excludingId ? { _id: { $ne: excludingId } } : {}),
      }).lean();

      if (!existing) return slug;

      attempt += 1;
      slug = `${base}-${attempt}`;
    }
  }

  public async createBlog(blogData: Partial<IBlog>): Promise<IBlog> {
    try {
      const content = String(blogData.content || "");
      const blog = new Blog({
        ...blogData,
        slug: this.normalizeSlug(String(blogData.slug || blogData.title || "")),
        readingTimeMinutes: this.calculateReadingTimeMinutes(content),
      });

      if (blog.status === "published" && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }

      await blog.save();
      logger.info(`Created blog post: ${blog.title}`);
      return blog;
    } catch (error: any) {
      logger.error(`Error creating blog post: ${error.message}`);
      throw error;
    }
  }

  public async getBlogs(
    filters: BlogFilters,
    page: number = 1,
    limit: number = 9,
    sortBy: string = "publishedAt",
    order: string = "desc"
  ): Promise<BlogListResult> {
    const query: any = {};

    if (filters.includeDraft !== true) {
      query.status = "published";
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: new RegExp(filters.search, "i") } },
        { excerpt: { $regex: new RegExp(filters.search, "i") } },
        { tags: { $elemMatch: { $regex: new RegExp(filters.search, "i") } } },
      ];
    }

    const allowedSortFields = ["createdAt", "updatedAt", "publishedAt", "title"];
    const normalizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : "publishedAt";
    const sortDirection = order === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;
    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort({ [normalizedSortBy]: sortDirection, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      blogs,
      total,
      page,
      limit,
    };
  }

  public async getBlogById(id: string): Promise<IBlog | null> {
    return Blog.findById(id).exec();
  }

  public async getBlogBySlug(slug: string): Promise<IBlog | null> {
    return Blog.findOne({ slug: this.normalizeSlug(slug), status: "published" }).exec();
  }

  public async getAnyBlogBySlug(slug: string): Promise<IBlog | null> {
    return Blog.findOne({ slug: this.normalizeSlug(slug) }).exec();
  }

  public async updateBlog(id: string, updateData: Partial<IBlog>): Promise<IBlog | null> {
    const existing = await Blog.findById(id);
    if (!existing) return null;

    Object.assign(existing, updateData);

    const nextContent = typeof existing.content === "string" ? existing.content : "";
    existing.readingTimeMinutes = this.calculateReadingTimeMinutes(nextContent);

    if (updateData.slug || updateData.title) {
      existing.slug = this.normalizeSlug(String(updateData.slug || updateData.title));
    }

    if (existing.status === "published" && !existing.publishedAt) {
      existing.publishedAt = new Date();
    }

    await existing.save();
    logger.info(`Updated blog post: ${existing.title} (${existing._id})`);
    return existing;
  }

  public async deleteBlog(id: string): Promise<boolean> {
    const deleted = await Blog.findByIdAndDelete(id);
    return Boolean(deleted);
  }
}

const blogService = new BlogService();

export default blogService;
