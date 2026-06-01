// my-leather-platform/lib/middleware/validateRequest.ts
import { NextRequest } from "next/server";
import {z, AnyZodObject, ZodError } from "zod";
import logger from "../config/logger";
import { NextResponse } from "next/server";

interface ValidationResult<T> {
  success: true;
  data: T;
}

interface ValidationFailedResult {
  success: false;
  errorResponse: NextResponse;
}

// Function to validate request parts using a Zod schema
export const validateRequest = async <T extends AnyZodObject>(
  schema: T,
  req: NextRequest,
  parsedBody: Record<string, any> = {} // New parameter for pre-parsed body (e.g., from FormData)
): Promise<ValidationResult<z.infer<T>> | ValidationFailedResult> => {
  try {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const params: Record<string, string> = {};

    // Basic extraction for dynamic route params (e.g., /api/resource/[id])
    // Next.js App Router API route handlers receive params directly,
    // so this 'params' extraction here is mainly for Zod's schema structure consistency.
    // In actual route.ts, params object is already available.
    const pathSegments = req.nextUrl.pathname.split('/').filter(Boolean);
    const dynamicSegmentIndex = pathSegments.indexOf('finished-products') + 1; // Assuming 'finished-products/[id]' structure
    if (pathSegments[dynamicSegmentIndex]) {
      params.id = pathSegments[dynamicSegmentIndex]; // Assign 'id'
    }

    // Combine request parts for Zod validation.
    // Use parsedBody if provided, otherwise an empty object.
    const dataToValidate = {
      body: parsedBody,
      query: query,
      params: params,
    };

    const parsedData = await schema.parseAsync(dataToValidate);

    return { success: true, data: parsedData };
  } catch (error: any) {
    logger.warn(`Validation error for ${req.method} ${req.nextUrl.pathname}: ${error.message}`);
    if (error instanceof ZodError) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            message: "Validation Error",
            errors: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    } else {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { success: false, message: "Internal Server Error" },
          { status: 500 }
        ),
      };
    }
  }
};