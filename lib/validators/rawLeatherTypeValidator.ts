// my-leather-platform/lib/validators/rawLeatherTypeValidator.ts
import { z } from "zod";

const rawLeatherTypeIdParam = z
  .string()
  .length(24, "Invalid raw leather type ID format.")
  .refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    "Invalid raw leather type ID format."
  );

// ✅ Create schema
export const createRawLeatherTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Raw leather type name must be at least 3 characters long.")
      .max(50, "Raw leather type name cannot exceed 50 characters."),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// ✅ Get by ID schema
export const getRawLeatherTypeByIdSchema = z.object({
  body: z.object({
    id: rawLeatherTypeIdParam,
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// ✅ Update schema
export const updateRawLeatherTypeSchema = z.object({
  body: z.object({
    id: rawLeatherTypeIdParam,
    name: z
      .string()
      .trim()
      .min(3, "Raw leather type name must be at least 3 characters long.")
      .max(50, "Raw leather type name cannot exceed 50 characters."),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// ✅ Delete schema
export const deleteRawLeatherTypeSchema = z.object({
  body: z.object({
    id: rawLeatherTypeIdParam,
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
