export type BlogStatus = "draft" | "published";

export interface IBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  status: BlogStatus;
  authorName: string;
  seoTitle?: string;
  seoDescription?: string;
  readingTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPagination {
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}
