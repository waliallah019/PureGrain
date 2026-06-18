// lib/validators/sampleRequestValidator.ts
import { z } from 'zod';
import {
  sampleTypes, urgencies, businessTypes, intendedUses, futureVolumes, countries
} from '@/lib/config/shippingConfig';

// Convert runtime arrays to Zod enums with 'as const' assertion for strict typing
const sampleTypesEnum = z.enum(sampleTypes as [string, ...string[]]);
const urgenciesEnum = z.enum(urgencies as [string, ...string[]]);
const businessTypesEnum = z.enum(businessTypes as [string, ...string[]]);
const intendedUsesEnum = z.enum(intendedUses as [string, ...string[]]);
const futureVolumesEnum = z.enum(futureVolumes as [string, ...string[]]);
const countriesEnum = z.enum(countries as [string, ...string[]]);

// Helper function to handle empty strings - transform empty strings to undefined
const optionalString = (schema: z.ZodType) =>
  z.preprocess((val) => {
    if (val === '' || val === null) return undefined;
    return val;
  }, schema.optional());

const sampleRequestItemSchema = z.object({
  productId: optionalString(z.string().max(64)),
  productName: optionalString(z.string().max(200)),
  productType: optionalString(z.string().max(60)),
  hideType: optionalString(z.string().max(60)),
  grade: optionalString(z.string().max(60)),
  thickness: optionalString(z.string().max(60)),
  tanningMethod: optionalString(z.string().max(60)),
  finish: optionalString(z.string().max(60)),
  variantId: optionalString(z.string().max(64)),
  variantName: optionalString(z.string().max(120)),
});

const createSampleRequestBodySchema = z.object({
  // FIX: Add requestNumber as optional in validation, generated in service
  requestNumber: optionalString(z.string().max(20)), // Allow optional short string
  // New (additive) fields for the unified review flow.
  orderRef: optionalString(z.string().max(40)),
  requestType: optionalString(z.enum(['HIDE', 'FINISHED_PRODUCT'])),
  // Business rule: hides allow 1–3 samples per request, finished products
  // are limited to exactly 1 per request. We keep `items` optional here so
  // legacy single-product flows (which use top-level productId/productName)
  // continue to validate, then enforce the count-by-type rule below in a
  // superRefine on the whole body.
  items: z.array(sampleRequestItemSchema).max(3).optional(),
  estimatedDays: optionalString(z.string().max(60)),
  industry: optionalString(z.string().max(80)),
  website: optionalString(z.string().max(200)),
  notes: optionalString(z.string().max(300)),
  trackingNumber: optionalString(z.string().max(80)),
  courierName: optionalString(z.string().max(80)),
  companyName: z.string().min(1, 'Company Name is required.').max(100, 'Company Name is too long.'),
  contactPerson: z.string().min(1, 'Contact Person is required.').max(100, 'Contact Person is too long.'),
  email: z.string().email('Invalid email format.').max(100, 'Email is too long.'),
  phone: optionalString(z.string().max(20, 'Phone number is too long.')),
  country: z.string().min(1, 'Country is required.'), // Allow any string for country
  urgency: optionalString(urgenciesEnum),
  address: z.string().min(1, 'Shipping Address is required.').max(500, 'Address is too long.'),
  sampleType: z.string().min(1, 'Sample type is required.'), // Allow any string for sample type
  quantitySamples: optionalString(z.string()),
  materialPreference: optionalString(z.string().max(100, 'Material preference is too long.')),
  finishType: optionalString(z.string().max(100, 'Finish type is too long.')),
  colorPreferences: optionalString(z.string().max(200, 'Color preferences are too long.')),
  specificRequests: optionalString(z.string().max(1000, 'Specific requests are too long.')),
  businessType: optionalString(z.string()),
  intendedUse: optionalString(z.string()),
  futureVolume: optionalString(z.string()),
  productId: optionalString(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID format.")),
  productName: optionalString(z.string()),
  productTypeCategory: optionalString(z.enum(['finished-product', 'raw-leather'])),
  shippingFee: z.number().min(0, 'Shipping fee must be a positive number.'),
  paymentStatus: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded']).default('pending').optional(),
  wiseTransferId: optionalString(z.string()),
  paypalOrderId: optionalString(z.string().max(64)),
  paypalTransactionId: optionalString(z.string().max(64)),
  paypalCaptureStatus: optionalString(z.string().max(32)),
  paypalPayerEmail: optionalString(z.string().email()),
  paymentMethod: optionalString(z.enum(['paypal', 'bank-transfer', 'manual'])),
  paymentCompletedAt: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return undefined;
    return typeof arg === 'string' ? new Date(arg) : arg;
  }, z.date().optional()),
  shippingTrackingLink: optionalString(z.string().url("Invalid URL format for tracking link.")),
  shippedAt: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return undefined;
    return typeof arg === 'string' ? new Date(arg) : arg;
  }, z.date().optional()),
  paymentConfirmationToken: optionalString(z.string()),
  paymentConfirmationTokenExpiry: z.preprocess((arg) => {
    if (arg === '' || arg === null || arg === undefined) return undefined;
    return typeof arg === 'string' ? new Date(arg) : arg;
  }, z.date().optional()),
}).strict().superRefine((data, ctx) => {
  // Enforce the asymmetric sample limits when the unified review flow
  // sends `requestType` + `items`. Legacy flows omit both and continue
  // to validate unchanged.
  if (!data.requestType || !data.items) return;
  const count = data.items.length;
  if (data.requestType === 'HIDE') {
    if (count < 1 || count > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Hide sample requests must include between 1 and 3 hides.',
      });
    }
  } else if (data.requestType === 'FINISHED_PRODUCT') {
    if (count !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Finished-product sample requests are limited to exactly 1 product.',
      });
    }
  }
});

const updateSampleRequestAdminBodySchema = z.object({
  // FIX: Allow updating requestNumber (though service will primarily set it)
  requestNumber: optionalString(z.string().max(20)),
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded']),
  shippingTrackingLink: optionalString(z.string().url("Invalid URL format for tracking link.")),
  trackingNumber: optionalString(z.string().max(64)),
  courierName: optionalString(z.string().max(64)),
});

const sampleRequestIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Sample Request ID."),
});

const sampleRequestQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded']).default('all'),
  country: z.string().optional(),
  sampleType: z.enum(['all', 'raw-leather', 'finished-products', 'both']).default('all'),
}).partial();

export const createSampleRequestSchema = z.object({
  body: createSampleRequestBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const getSampleRequestListFilterSchema = z.object({
  query: sampleRequestQuerySchema,
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateSampleRequestAdminSchema = z.object({
  body: updateSampleRequestAdminBodySchema,
});

export const deleteSampleRequestSchema = z.object({
    params: sampleRequestIdParamSchema,
    query: z.object({}).optional(),
    body: z.object({}).optional(),
});

export { sampleRequestIdParamSchema as IdParamSchema };