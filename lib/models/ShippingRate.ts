// lib/models/ShippingRate.ts
//
// Per-country shipping rates for the new sample-request review flow.
// The legacy `lib/config/shippingConfig.ts` continues to drive existing
// flows (`/sample-request`, `/request-sample/pay`) — this collection is
// only consulted by the new `/sample-request/review` flow and the
// `GET /api/sample-request/shipping-rate` endpoint.
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IShippingRate extends Document {
  country: string;
  region: string;
  dhlZone: string;
  rateUsd: number;
  transitDays: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingRateSchema: Schema<IShippingRate> = new Schema<IShippingRate>(
  {
    country: { type: String, required: true, unique: true, trim: true },
    region: { type: String, required: true, trim: true },
    dhlZone: { type: String, required: true, trim: true },
    rateUsd: { type: Number, required: true, min: 0 },
    transitDays: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ShippingRateSchema.index({ country: 1 }, { unique: true });

const ShippingRate: Model<IShippingRate> =
  (mongoose.models.ShippingRate as Model<IShippingRate>) ||
  mongoose.model<IShippingRate>("ShippingRate", ShippingRateSchema);

export default ShippingRate;
