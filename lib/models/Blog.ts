import mongoose, { Document, Model, Schema } from "mongoose";

export type BlogStatus = "draft" | "published";

export interface IBlog extends Document {
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
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, trim: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    authorName: { type: String, required: true, trim: true, default: "Pure Grain Team" },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    readingTimeMinutes: { type: Number, min: 1, default: 1 },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });
BlogSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });

const Blog: Model<IBlog> =
  (mongoose.models.Blog as Model<IBlog>) || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
