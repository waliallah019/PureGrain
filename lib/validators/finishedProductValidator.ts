import { z } from "zod";

// Helper function for boolean preprocessing (for request body)
const booleanStringCoercer = z.preprocess(
  (val) => {
    if (val === "true") {
      return true;
    }
    if (val === "false" || val === "") {
      return false;
    }
    if (typeof val === "boolean") {
      return val;
    }
    return undefined;
  },
  z.boolean(),
);

export const createFinishedProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters long."),
    // Changed productType from enum to string
    productType: z.string().trim().min(1, "Product type is required."),
    materialUsed: z
      .string()
      .trim()
      .min(3, "Material used must be at least 3 characters long."),
    dimensions: z
      .string()
      .trim()
      .min(1, "Dimensions are required and cannot be empty."),
    moq: z.coerce.number().int().min(1, "MOQ must be a positive integer."),
    colorVariants: z
      .array(z.string().trim().min(1, "Color variant cannot be empty."))
      .optional()
      .default([]),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters long."),
    isFeatured: booleanStringCoercer.optional().default(false),
    sampleAvailable: booleanStringCoercer.optional().default(false), // NEW FIELD
    isActive: booleanStringCoercer.optional().default(true),
    isArchived: booleanStringCoercer.optional().default(false),
    pricePerUnit: z.coerce
      .number()
      .positive("Price per unit must be a positive number."),
    priceUnit: z
      .string()
      .trim()
      .min(1, "Price unit is required (e.g., 'per piece', 'per dozen')."),
    currency: z.string().trim().optional().default("USD"),
    availability: z
      .enum(["In Stock", "Made to Order", "Limited Stock"])
      .optional()
      .default("Made to Order"),
    stockCount: z.coerce.number().int().min(0).optional().default(0),
    category: z.string().trim().optional(),
    tags: z
      .array(z.string().trim().min(1, "Tag cannot be empty."))
      .optional()
      .default([]),
  }),
});

export const updateFinishedProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters long.")
      .optional(),
    // Changed productType from enum to string
    productType: z.string().trim().min(1, "Product type is required.").optional(),
    materialUsed: z
      .string()
      .trim()
      .min(3, "Material used must be at least 3 characters long.")
      .optional(),
    dimensions: z
      .string()
      .trim()
      .min(1, "Dimensions are required and cannot be empty.")
      .optional(),
    moq: z.coerce
      .number()
      .int()
      .min(1, "MOQ must be a positive integer.")
      .optional(),
    colorVariants: z
      .array(z.string().trim().min(1, "Color variant cannot be empty."))
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters long.")
      .optional(),
    isFeatured: booleanStringCoercer.optional(),
    sampleAvailable: booleanStringCoercer.optional(), // NEW FIELD
    isActive: booleanStringCoercer.optional(),
    isArchived: booleanStringCoercer.optional(),
    pricePerUnit: z.coerce.number().positive().optional(),
    priceUnit: z.string().trim().min(1).optional(),
    currency: z.string().trim().optional(),
    availability: z
      .enum(["In Stock", "Made to Order", "Limited Stock"])
      .optional(),
    stockCount: z.coerce.number().int().min(0).optional(),
    category: z.string().trim().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
  }),
  params: z
    .object({
      id: z
        .string()
        .length(24, "Invalid product ID format.")
        .refine(
          (val) => /^[0-9a-fA-F]{24}$/.test(val),
          "Invalid product ID format.",
        ),
    })
    .optional(),
});

export const getFinishedProductsFilterSchema = z.object({
  query: z.object({
    productType: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    page: z.string().transform(Number).optional().default("1"),
    limit: z.string().transform(Number).optional().default("10"),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    category: z.string().optional(),
    availability: z
      .enum(["In Stock", "Made to Order", "Limited Stock"])
      .optional(),
    isActive: z.preprocess(
      (val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      },
      z.boolean().optional(),
    ),
    isArchived: z.preprocess(
      (val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      },
      z.boolean().optional(),
    ),
    isFeatured: z.preprocess(
      (val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      },
      z.boolean().optional(),
    ),
    sampleAvailable: z.preprocess( // NEW FIELD for filtering
      (val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      },
      z.boolean().optional(),
    ),
  }),
});

export const getFinishedProductByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .length(24, "Invalid product ID format.")
      .refine(
        (val) => /^[0-9a-fA-F]{24}$/.test(val),
        "Invalid product ID format.",
      ),
  }),
});

export const removeImagesSchema = z.object({
  params: z.object({
    id: z
      .string()
      .length(24, "Invalid product ID format.")
      .refine(
        (val) => /^[0-9a-fA-F]{24}$/.test(val),
        "Invalid product ID format.",
      ),
  }),
  body: z.object({
    imageUrls: z
      .array(z.string().url("Invalid image URL format."))
      .min(1, "At least one image URL must be provided."),
  }),
});