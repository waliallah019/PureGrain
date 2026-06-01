// my-leather-platform/lib/validators/contactValidator.ts
import { z } from 'zod';

export const contactFormSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full Name is required."),
    companyName: z.string().trim().min(2, "Company Name is required."),
    email: z.string().trim().email("Invalid email address.").min(1, "Email Address is required."),
    phone: z.string().trim().optional(), // Optional
    country: z.string().trim().min(1, "Country is required."),
		industry: z.string().trim().min(1, "Industry is required."),
    inquiryType: z.enum([
      "quote", "sample", "custom", "partnership", "general", "support", // Existing simple options
      "request_quote", "sample_request", "custom_manufacturing", // Example transformed
      "partnership_inquiry", "general_information", "customer_support" // Example transformed
    ], { message: "Invalid inquiry type." }).default("general_information"), // Match transformed
    message: z.string().trim().min(10, "Message must be at least 10 characters long."),
  }),
});

// Schemas for admin operations on messages

	export const updateMessageStatusSchema = z.object({
	  body: z.object({ // All fields come via 'body' (which route handler constructed)
	    id: z.string().length(24, "Invalid message ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid message ID format."), // ID in body
	    status: z.enum(['read', 'replied', 'archived'], { message: "Invalid message status." }),
	    replyText: z.string().trim().optional(),
	  }),
	  // query and params schemas are not directly used here because 'validateRequest'
	  // bundles everything into 'body' then tries to extract 'params' internally from path
	});
	
	// Delete message schema (for DELETE /api/messages/[id])
	// ID is now EXPECTED IN BODY
	export const deleteMessageSchema = z.object({
	  body: z.object({
	    id: z.string().length(24, "Invalid message ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid message ID format."), // ID in body
	  }),
	});
	
	// getAdminListFilterSchema (no changes needed from previous corrected version)
	// This applies to GET /api/messages and GET /api/notifications
	export const getAdminListFilterSchema = z.object({
	  query: z.object({
	    page: z.preprocess((val) => parseInt(String(val)), z.number().min(1).default(1)).optional(),
	    limit: z.preprocess((val) => parseInt(String(val)), z.number().min(1).default(10)).optional(),
	    search: z.string().optional(),
	    sortBy: z.string().optional(),
	    order: z.enum(['asc', 'desc']).optional(),
	    status: z.enum(['unread', 'read', 'replied', 'archived']).optional(),
	    priority: z.enum(['low', 'medium', 'high']).optional(),
	    category: z.enum(['general', 'support', 'sales', 'complaint', 'quote', 'sample', 'custom', 'partnership']).optional(),
	    read: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()).optional(),
	    type: z.enum(['info', 'warning', 'error', 'success', 'new_message']).optional(),
	  }),
	});
  // Schema for validating dynamic route parameters (e.g., for /messages/[id])
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().length(24, "Invalid ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid ID format."),
  }),
});

// Update notification status schema (for PATCH /api/notifications/[id])
export const updateNotificationStatusSchema = z.object({
  body: z.object({
    id: z.string().length(24, "Invalid notification ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid notification ID format."), // ID in body
    read: z.boolean(),
  }),
});

// Delete notification schema (for DELETE /api/notifications/[id])
export const deleteNotificationSchema = z.object({
  body: z.object({
    id: z.string().length(24, "Invalid notification ID format.").refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid notification ID format."), // ID in body
  }),
});