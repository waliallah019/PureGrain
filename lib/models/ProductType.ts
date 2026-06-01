import mongoose, { Document, Schema, Model } from "mongoose";

export interface IProductType extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductTypeSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
  }
);

ProductTypeSchema.index({ name: 1 }); // Index for efficient lookup

const ProductType: Model<IProductType> =
  (mongoose.models.ProductType as Model<IProductType>) ||
  mongoose.model<IProductType>("ProductType", ProductTypeSchema);

export default ProductType;