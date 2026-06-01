// my-leather-platform/lib/validators/notificationValidator.ts
import { z } from "zod";

// --- Individual Schemas (flat, as they describe the sub-object) ---
export const notificationQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  read: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        if (val === 'true') return true;
        if (val === 'false') return false;
      }
      return val;
    },
    z.boolean().optional()
  ),
  type: z.enum([
    'all',
    'info', 'warning', 'error', 'success', 'new_message', 'new_custom_request', 
    'new_sample_request', 'sample_status_update',
    'payment_confirmed', 'payment_failed',
    'new_quote_request', 'quote_status_update', 'invoice_sent', 'payment_received'
  ] as const).default('all'),
}).partial(); // All are optional query parameters

export const notificationUpdateBodySchema = z.object({
  // Making 'read' optional if not provided by client, otherwise it defaults to true
  // If the client explicitly sends `read: false`, it will be `false`.
  // If the client sends an empty object `{}`, `read` will be `true`.
  // If the client sends `read: undefined`, `read` will be `true`.
  read: z.boolean().optional().default(true), // <--- CHANGE IS HERE: Added optional().default(true)
  // If you want 'read' to be optional but NOT default to true (i.e., if not present, don't update 'read'),
  // then just use: read: z.boolean().optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Notification ID."),
});

// --- Combined Schemas for `validateRequest` (CRITICAL: All must have body/query/params) ---

export const getNotificationListFilterSchema = z.object({
  query: notificationQuerySchema,
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateNotificationStatusSchema = z.object({
  body: notificationUpdateBodySchema,
  params: notificationIdParamSchema,
  query: z.object({}).optional(),
});

export const deleteNotificationSchema = z.object({
  params: notificationIdParamSchema,
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});