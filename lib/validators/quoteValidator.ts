import { z } from 'zod';
import { countries } from '@/lib/config/shippingConfig';

// Enums from your types/quote.ts to ensure consistency
const quoteRequestStatusEnum = z.enum(['requested', 'approved', 'rejected', 'paid', 'dispatched', 'cancelled']);
const quotePaymentMethodEnum = z.enum(['100_advance_bank_transfer', '30_70_split_bank_transfer', 'letter_of_credit']);
const quoteRequestItemTypeEnum = z.enum(['finished-product', 'raw-leather', 'custom']);
const invoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'cancelled']);
const paymentTermsEnum = z.enum(['100_advance', '30_70_split', 'lc']);


// --- Individual Schemas (flat, as they describe the sub-object) ---
const createQuoteRequestBodySchema = z.object({
  // FIX: Add requestNumber as optional in validation, generated in service
  requestNumber: z.string().max(20).optional(),
  itemName: z.string().min(1, 'Item name is required.').max(200, 'Item name is too long.'),
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format.').optional().or(z.literal('')),
  itemTypeCategory: quoteRequestItemTypeEnum,

  customerName: z.string().min(1, 'Your name is required.').max(100),
  customerEmail: z.string().email('Invalid email format.').max(100),
  companyName: z.string().min(1, 'Company name is required.').max(200),
  customerPhone: z.string().max(20).optional().or(z.literal('')),
  destinationCountry: z.enum(countries as [string, ...string[]], { required_error: 'Destination country is required.' }),

  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  quantityUnit: z.string().min(1, 'Quantity unit is required.').max(50),
  additionalComments: z.string().max(1000).optional().or(z.literal('')),
}).strict();

export const updateQuoteRequestRequestBodySchema = z.object({
  // FIX: Allow updating requestNumber (though service will primarily set it)
  requestNumber: z.string().max(20).optional(),
  status: quoteRequestStatusEnum.optional(),
  adminComments: z.string().max(1000).optional().or(z.literal('')),
  proposedPricePerUnit: z.union([z.number().min(0), z.literal('')]).optional(),
  proposedTotalPrice: z.union([z.number().min(0), z.literal('')]).optional(),
  paymentMethod: quotePaymentMethodEnum.optional(),
  paymentDetails: z.object({
    accountTitle: z.string().optional().or(z.literal('')),
    bankName: z.string().optional().or(z.literal('')),
    accountNumber: z.string().optional().or(z.literal('')),
    swiftCode: z.string().optional().or(z.literal('')),
    iban: z.string().optional().or(z.literal('')),
    customTerms: z.string().max(500).optional().or(z.literal('')),
  }).optional(),
  lcDetails: z.object({
    bankName: z.string().min(1, 'LC bank name is required for LC payment.').max(100),
    contactPerson: z.string().max(100).optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email format.').max(100).optional().or(z.literal('')),
    documentsUploaded: z.boolean().optional(),
    documents: z.array(z.string().url('Invalid document URL.')).optional(),
    lcStatus: z.enum(['initiated', 'confirmed', 'rejected', 'completed']).optional(),
  }).optional(),
  trackingNumber: z.string().max(100).optional().or(z.literal('')),
  trackingLink: z.string().url('Invalid tracking link URL.').max(200).optional().or(z.literal('')),
  dispatchedAt: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : arg), z.date()).optional(),
}).strict();

const generateInvoiceRequestBodySchema = z.object({
  proposedPricePerUnit: z.union([z.number().min(0, 'Proposed unit price must be positive.'), z.literal('')]),
  taxRate: z.union([z.number().min(0).max(1), z.literal('')]).optional(),
  shippingCost: z.union([z.number().min(0), z.literal('')]).optional(),
  paymentTerms: paymentTermsEnum,
  paymentInstructions: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  lcBankName: z.string().max(100).optional().or(z.literal('')),
  lcContactPerson: z.string().max(100).optional().or(z.literal('')),
  lcContactEmail: z.string().email('Invalid email format.').max(100).optional().or(z.literal('')),
}).strict();


// Schema for GET quote requests list (validates the query parameters directly)
const getQuoteRequestQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: quoteRequestStatusEnum.or(z.literal('all')).default('all'),
  destinationCountry: z.string().optional(),
  itemTypeCategory: quoteRequestItemTypeEnum.or(z.literal('all')).default('all'),
}).partial();


// Schemas for route params (e.g., /api/quote-requests/[id])
const quoteRequestIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quote Request ID format.'),
});


// --- Combined Schemas for `validateRequest` (CRITICAL: All must have body/query/params) ---

export const createQuoteRequestCombinedSchema = z.object({
  body: createQuoteRequestBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateQuoteRequestCombinedSchema = z.object({
  body: updateQuoteRequestRequestBodySchema,
  params: quoteRequestIdParamSchema,
  query: z.object({}).optional(),
});

export const getQuoteRequestsListCombinedSchema = z.object({
  query: getQuoteRequestQuerySchema,
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const getQuoteRequestByIdCombinedSchema = z.object({
  params: quoteRequestIdParamSchema,
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const deleteQuoteRequestCombinedSchema = z.object({
  params: quoteRequestIdParamSchema,
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const generateInvoiceCombinedSchema = z.object({
  body: generateInvoiceRequestBodySchema,
  params: quoteRequestIdParamSchema,
  query: z.object({}).optional(),
});