import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRawLeatherType extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const RawLeatherTypeSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
  }
);

RawLeatherTypeSchema.index({ name: 1 });

const RawLeatherType: Model<IRawLeatherType> =
  (mongoose.models.RawLeatherType as Model<IRawLeatherType>) ||
  mongoose.model<IRawLeatherType>("RawLeatherType", RawLeatherTypeSchema);

export default RawLeatherType;