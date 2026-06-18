// my-leather-platform/lib/validators/customManufacturingValidator.ts
import { z } from "zod";

export const createCustomManufacturingRequestSchema = z.object({
  body: z.object({
    companyName: z.string().trim().min(1, "Company Name is required."),
    contactPerson: z.string().trim().min(1, "Contact Person is required."),
    email: z.string().email("Invalid email address.").min(1, "Email is required."),
    phone: z.string().trim().optional(),
    productType: z.string().trim().min(1, "Product Type is required."),
    estimatedQuantity: z.string().trim().min(1, "Estimated Quantity is required."),
    preferredMaterial: z.string().trim().optional(),
    colors: z.string().trim().optional(),
    timeline: z.string().trim().optional(),
    // designFiles: handled by backend route directly via Cloudinary upload.
    // The route layer enforces the business rule that at least one of
    // `specifications` or an uploaded design file must be present.
    specifications: z.string().trim().optional(),
    budgetRange: z.string().trim().optional(),
  }),
});

export const updateCustomManufacturingRequestSchema = z.object({
  // --- WORKAROUND START: ID expected in body due to validateRequest.ts constraint ---
  body: z.object({
    id: z.string().length(24, "Invalid request ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid request ID format."),
    companyName: z.string().trim().min(1, "Company Name is required.").optional(),
    contactPerson: z.string().trim().min(1, "Contact Person is required.").optional(),
    email: z.string().email("Invalid email address.").min(1, "Email is required.").optional(),
    phone: z.string().trim().optional(),
    productType: z.string().trim().min(1, "Product Type is required.").optional(),
    estimatedQuantity: z.string().trim().min(1, "Estimated Quantity is required.").optional(),
    preferredMaterial: z.string().trim().optional(),
    colors: z.string().trim().optional(),
    timeline: z.string().trim().optional(),
    designFiles: z.array(z.string().url("Invalid URL format for design file.")).optional(),
    specifications: z.string().trim().optional(),
    budgetRange: z.string().trim().optional(),
    status: z.enum(["submitted", "under_review", "approved", "rejected", "invoice_sent", "payment_pending", "paid", "processing", "shipped", "delivered", "cancelled", "expired", "requested", "Pending", "Reviewed", "Contacted", "Completed", "Archived"]).optional(),
  }),
  // Removed `params` property from here, as `validateRequest` doesn't populate it correctly for this route
});


export const getCustomManufacturingRequestFilterSchema = z.object({
  query: z.object({
    status: z.enum(["submitted", "under_review", "approved", "rejected", "invoice_sent", "payment_pending", "paid", "processing", "shipped", "delivered", "cancelled", "expired", "Pending", "Reviewed", "Contacted", "Completed", "Archived"]).optional(),
    search: z.string().optional(),
    page: z.string().transform(Number).optional().default("1"),
    limit: z.string().transform(Number).optional().default("10"),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const getCustomManufacturingRequestByIdSchema = z.object({
  // --- WORKAROUND START: ID expected in body due to validateRequest.ts constraint ---
  body: z.object({ // ID will be manually merged into body before validateRequest
    id: z.string().length(24, "Invalid request ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid request ID format."),
  }),
  // Removed `params` property from here
});
// --- WORKAROUND END ---