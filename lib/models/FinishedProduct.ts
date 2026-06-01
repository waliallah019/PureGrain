import mongoose, { Document, Schema, Model } from "mongoose";

export interface IFinishedProduct extends Document {
  name: string;
  productType: string; // Changed from enum to string
  materialUsed: string;
  dimensions: string;
  moq: number;
  colorVariants: string[];
  description: string;
  images: string[];
  isFeatured: boolean;
  sampleAvailable: boolean; // NEW FIELD
  pricePerUnit: number;
  priceUnit: string;
  currency: string;
  availability: "In Stock" | "Made to Order" | "Limited Stock";
  stockCount: number;
  category?: string;
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FinishedProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    productType: {
      type: String, // Changed from enum to string
      required: true,
      trim: true,
    },
    materialUsed: { type: String, required: true, trim: true },
    dimensions: { type: String, required: true, trim: true },
    moq: { type: Number, required: true, min: 1 },
    colorVariants: { type: [String], default: [] },
    description: { type: String, required: true, trim: true },
    images: { type: [String], required: true },
    isFeatured: { type: Boolean, default: false },
    sampleAvailable: { type: Boolean, default: false }, // NEW FIELD
    pricePerUnit: { type: Number, required: true },
    priceUnit: { type: String, required: true, trim: true },
    currency: { type: String, default: "USD", trim: true },
    availability: {
      type: String,
      enum: ["In Stock", "Made to Order", "Limited Stock"],
      default: "Made to Order",
    },
    stockCount: { type: Number, default: 0 },
    category: { type: String, trim: true },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

FinishedProductSchema.index({
  productType: 1,
  materialUsed: 1,
  colorVariants: 1,
  category: 1,
  availability: 1,
  isActive: 1,
  sampleAvailable: 1, // NEW INDEX
});
FinishedProductSchema.index({ name: "text", description: "text", tags: "text" }); // For text search

const FinishedProduct: Model<IFinishedProduct> =
  (mongoose.models.FinishedProduct as Model<IFinishedProduct>) ||
  mongoose.model<IFinishedProduct>("FinishedProduct", FinishedProductSchema);

export default FinishedProduct;