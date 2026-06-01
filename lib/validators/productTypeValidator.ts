import { z } from "zod";

const productTypeIdParam = z
  .string()
  .length(24, "Invalid product type ID format.")
  .refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    "Invalid product type ID format.",
  );

export const createProductTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Product type name must be at least 3 characters long.")
      .max(50, "Product type name cannot exceed 50 characters."),
  }),
});

export const getProductTypeByIdSchema = z.object({
  params: z.object({
    id: productTypeIdParam,
  }),
});

export const updateProductTypeSchema = z.object({
  params: z.object({
    id: productTypeIdParam,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Product type name must be at least 3 characters long.")
      .max(50, "Product type name cannot exceed 50 characters."),
  }),
});

export const deleteProductTypeSchema = z.object({
  params: z.object({
    id: productTypeIdParam,
  }),
});