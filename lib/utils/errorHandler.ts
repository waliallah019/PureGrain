// my-leather-platform/lib/utils/errorHandler.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "../config/logger";

interface CustomError extends Error {
  statusCode?: number;
  data?: any;
}

export function handleApiError(error: any): NextResponse {
  logger.error(`API Error: ${error.message}`, { stack: error.stack });

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation Error",
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle specific known errors
  if (error.statusCode) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: error.data,
      },
      { status: error.statusCode }
    );
  }

  // Generic server error
  return NextResponse.json(
    {
      success: false,
      message: "Internal Server Error",
    },
    { status: 500 }
  );
}