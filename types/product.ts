export interface IProduct {
  _id: string;
  name: string;
  // Changed productType from enum to string
  productType: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IProductType { // NEW INTERFACE for fetched product types
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  totalProducts: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}