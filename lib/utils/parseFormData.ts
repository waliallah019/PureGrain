// my-leather-platform/lib/utils/parseFormData.ts
import { NextRequest } from "next/server";
import logger from "../config/logger";

interface ParsedFormDataResult {
  fields: Record<string, any>; // Text fields
  files: { name: string; file: File }[]; // Array of File objects for uploads
}

/**
 * Parses a NextRequest expecting multipart/form-data.
 * Extracts text fields and file fields.
 *
 * @param req The NextRequest object.
 * @returns An object containing separated fields and files.
 */
export async function parseFormData(req: NextRequest): Promise<ParsedFormDataResult> {
  const fields: Record<string, any> = {};
  const files: { name: string; file: File }[] = [];

  try {
    const formData = await req.formData();

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push({ name: key, file: value });
      } else {
        // Handle potential array values from FormData, e.g., colorVariants[]
        if (key.endsWith('[]')) {
          const baseKey = key.slice(0, -2);
          if (!fields[baseKey]) {
            fields[baseKey] = [];
          }
          (fields[baseKey] as string[]).push(value);
        } else {
          fields[key] = value;
        }
      }
    }
    logger.debug("Parsed FormData:", { fields: Object.keys(fields), files: files.map(f => f.file.name) });
  } catch (error: any) {
    logger.error(`Error parsing FormData: ${error.message}`);
    throw new Error(`Failed to parse form data: ${error.message}`);
  }

  return { fields, files };
}