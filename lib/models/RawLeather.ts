import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRawLeather extends Document {
  name: string;
  leatherType: string; // Changed from enum to string
  animal: string;
  finish: string;
  thickness: string;
  size: string;
  colors: string[];
  minOrderQuantity: number;
  sampleAvailable: boolean;
  images: string[];
  description: string;
  isFeatured: boolean;
  isArchived: boolean;
  pricePerSqFt: number;
  currency: string;
  priceTier: Array<{ minQty: number; price: number }>;
  priceUnit: string;
  discountAvailable: boolean;
  negotiable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RawLeatherSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    leatherType: {
      type: String, // Changed from enum to string
      required: true,
      trim: true,
    },
    animal: {
      type: String,
      required: true,
      enum: ["Cow", "Buffalo", "Goat", "Sheep", "Exotic"],
      trim: true,
    },
    finish: {
      type: String,
      required: true,
      enum: ["Aniline", "Semi-Aniline", "Pigmented", "Pull-up", "Crazy Horse", "Waxed", "Nappa", "Embossed"],
      trim: true,
    },
    thickness: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    colors: { type: [String], default: [] },
    minOrderQuantity: { type: Number, required: true, min: 1 },
    sampleAvailable: { type: Boolean, default: false },
    images: { type: [String], required: true },
    description: { type: String, required: true, trim: true },
    isFeatured: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    pricePerSqFt: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", trim: true },
    priceTier: {
      type: [{
        minQty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
      }],
      default: []
    },
    priceUnit: { type: String, required: true, trim: true },
    discountAvailable: { type: Boolean, default: false },
    negotiable: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Update indexes for efficient filtering
RawLeatherSchema.index({
  leatherType: 1,
  animal: 1,
  finish: 1,
  colors: 1,
  isFeatured: 1,
  isArchived: 1,
  pricePerSqFt: 1,
});
// Add a text index for name and description for search
RawLeatherSchema.index({ name: "text", description: "text" });


const RawLeather: Model<IRawLeather> =
  (mongoose.models.RawLeather as Model<IRawLeather>) ||
  mongoose.model<IRawLeather>("RawLeather", RawLeatherSchema);

export default RawLeather;