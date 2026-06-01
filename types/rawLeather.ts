import { Pagination as SharedPagination } from "./product";

export interface IRawLeather {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IRawLeatherType { // NEW INTERFACE
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type Pagination = SharedPagination;