import { z } from "zod";

// Helper function for boolean preprocessing (for request body and query)
const booleanStringCoercer = z.preprocess(
  (val) => {
    if (val === 'true') return true;
    if (val === 'false' || val === '') return false;
    if (typeof val === 'boolean') return val;
    return undefined; // Let .optional() or .default() handle missing/empty/invalid
  },
  z.boolean()
);

export const createRawLeatherSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters long."),
    leatherType: z.string().trim().min(1, "Leather type is required."), // Changed from z.enum to z.string()
    animal: z.enum([
      "Cow", "Buffalo", "Goat", "Sheep", "Exotic"
    ], { message: "Invalid animal type." }).refine((val) => val.length > 0, { message: "Animal type is required." }),
    finish: z.enum([
      "Aniline", "Semi-Aniline", "Pigmented", "Pull-up", "Crazy Horse", "Waxed", "Nappa", "Embossed"
    ], { message: "Invalid finish type." }).refine((val) => val.length > 0, { message: "Finish type is required." }),
    thickness: z.string().trim().min(1, "Thickness is required."),
    size: z.string().trim().min(1, "Size is required."),
    colors: z
      .array(z.string().trim().min(1, "Color cannot be empty."))
      .optional()
      .default([]),
    minOrderQuantity: z.coerce.number().int().min(1, "Min Order Quantity must be a positive integer."),
    sampleAvailable: booleanStringCoercer.optional().default(false), // Apply coercer
    description: z.string().trim().min(10, "Description must be at least 10 characters long."),
    // New fields
    isFeatured: booleanStringCoercer.optional().default(false),
    isArchived: booleanStringCoercer.optional().default(false),
    pricePerSqFt: z.coerce.number().min(0, "Price per square foot must be a non-negative number."),
    currency: z.string().trim().optional().default("USD"),
    priceTier: z.array(z.object({
      minQty: z.coerce.number().int().min(1, "Min Quantity must be a positive integer."),
      price: z.coerce.number().min(0, "Price must be a non-negative number.")
    })).optional().default([]),
    priceUnit: z.string().trim().min(1, "Price unit is required."),
    discountAvailable: booleanStringCoercer.optional().default(false),
    negotiable: booleanStringCoercer.optional().default(false),
  }),
});

export const updateRawLeatherSchema = z.object({
  // --- WORKAROUND START: Expect ID in body for raw-leather routes ---
  body: z.object({
    id: z.string().length(24, "Invalid raw leather ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid raw leather ID format."),
    name: z.string().trim().min(3, "Name must be at least 3 characters long.").optional(),
    leatherType: z.string().trim().min(1, "Leather type is required.").optional(), // Changed from z.enum to z.string()
    animal: z.enum([
      "Cow", "Buffalo", "Goat", "Sheep", "Exotic"
    ], { message: "Invalid animal type." }).optional(),
    finish: z.enum([
      "Aniline", "Semi-Aniline", "Pigmented", "Pull-up", "Crazy Horse", "Waxed", "Nappa", "Embossed"
    ], { message: "Invalid finish type." }).optional(),
    thickness: z.string().trim().min(1, "Thickness is required.").optional(),
    size: z.string().trim().min(1, "Size is required.").optional(),
    colors: z
      .array(z.string().trim().min(1, "Color cannot be empty."))
      .optional(),
    minOrderQuantity: z.coerce.number().int().min(1, "Min Order Quantity must be a positive integer.").optional(),
    sampleAvailable: booleanStringCoercer.optional(),
    description: z.string().trim().min(10, "Description must be at least 10 characters long.").optional(),
    isFeatured: booleanStringCoercer.optional(),
    isArchived: booleanStringCoercer.optional(),
    pricePerSqFt: z.coerce.number().min(0).optional(),
    currency: z.string().trim().optional(),
    priceTier: z.array(z.object({
      minQty: z.coerce.number().int().min(1),
      price: z.coerce.number().min(0)
    })).optional(),
    priceUnit: z.string().trim().min(1).optional(),
    discountAvailable: booleanStringCoercer.optional(),
    negotiable: booleanStringCoercer.optional(),
  }),
  // REMOVED: `params` property from here, as `validateRequest` doesn't populate it correctly for raw-leather
});

export const getRawLeatherByIdSchema = z.object({
  // --- WORKAROUND START: Expect ID in body for raw-leather routes ---
  body: z.object({ // ID will be manually merged into body before validateRequest
    id: z.string().length(24, "Invalid raw leather ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid raw leather ID format."),
  }),
  // REMOVED: `params` property from here
});

export const removeRawLeatherImagesSchema = z.object({
  // --- WORKAROUND START: Expect ID in body for raw-leather routes ---
  body: z.object({ // ID will be manually merged into body before validateRequest
    id: z.string().length(24, "Invalid raw leather ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid raw leather ID format."),
    imageUrls: z.array(z.string().url("Invalid image URL format.")).min(1, "At least one image URL must be provided."),
  }),
  // REMOVED: `params` property from here
});
// --- WORKAROUND END ---

export const getRawLeatherFilterSchema = z.object({
  query: z.object({
    leatherType: z.string().optional(), // Now a string filter
    animal: z.string().optional(),
    finish: z.string().optional(),
    color: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    isFeatured: booleanStringCoercer.optional(),
    isArchived: booleanStringCoercer.optional(),
    priceUnit: z.string().optional(),
    discountAvailable: booleanStringCoercer.optional(),
    negotiable: booleanStringCoercer.optional(),
    // Pagination params also part of query, no change needed here.
    page: z.string().transform(Number).optional().default("1"),
    limit: z.string().transform(Number).optional().default("10"),
  }),
  // No 'params' field needed here, as GET /api/raw-leather has no dynamic segments.
});