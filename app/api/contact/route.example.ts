/**
 * Example API Route with Full Validation & Security
 * Copy this pattern to all API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateRequest, requireRole, rateLimit, handleApiError } from '@/lib/validation/middleware'
import { validateEmail, validateCompanyName, validatePersonName, validateTextArea } from '@/lib/validation/validators'
import { logger } from '@/lib/logger'

// Rate limiting: 10 requests per minute per IP
const contactRateLimit = rateLimit(10, 60000)

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const limit = await contactRateLimit(req)
    if (!limit.allowed) {
      return limit.errorResponse
    }

    // 2. Parse request body
    const body = await req.json()

    // 3. Validate and sanitize input
    const validation = await validateRequest({
      rules: {
        fullName: {
          required: true,
          minLength: 2,
          maxLength: 100,
          custom: validatePersonName,
        },
        companyName: {
          required: true,
          minLength: 2,
          maxLength: 100,
          custom: validateCompanyName,
        },
        email: {
          required: true,
          custom: validateEmail,
        },
        phone: {
          required: false,
          maxLength: 20,
          // Phone validation is optional
        },
        country: {
          required: true,
          maxLength: 100,
        },
        inquiryType: {
          required: true,
        },
        message: {
          required: true,
          minLength: 10,
          maxLength: 2000,
          custom: (value) => validateTextArea(value, 10, 2000, 'Message'),
        },
      },
      sanitize: true,
      logErrors: true,
    })(req, body)

    if (!validation.isValid) {
      return validation.errorResponse
    }

    // 4. Use sanitized data
    const { sanitizedData } = validation

    // 5. Map inquiry type (additional validation)
    const inquiryTypeMap: Record<string, string> = {
      'Request Quote': 'quote',
      'Sample Request': 'sample',
      'Custom Manufacturing': 'custom',
      'Partnership Inquiry': 'partnership',
      'General Information': 'general',
      'Customer Support': 'support',
    }

    const backendInquiryType = inquiryTypeMap[sanitizedData!.inquiryType] || 'general'

    // 6. Prepare payload (filter allowed fields - mass assignment prevention)
    const payload = {
      fullName: sanitizedData!.fullName,
      companyName: sanitizedData!.companyName,
      email: sanitizedData!.email,
      phone: sanitizedData!.phone || undefined,
      country: sanitizedData!.country,
      inquiryType: backendInquiryType,
      message: sanitizedData!.message,
    }

    // 7. Save to database (use parameterized queries!)
    // Example with Mongoose (already uses parameterized queries):
    // const message = await Message.create(payload)

    // 8. Log success
    logger.info('Contact form submitted', {
      email: payload.email,
      inquiryType: payload.inquiryType,
    })

    // 9. Return success response
    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We will contact you within 24 hours.',
    })

  } catch (error: any) {
    // 10. Handle errors securely
    return handleApiError(error)
  }
}

// Admin-only endpoint example
export async function GET(req: NextRequest) {
  try {
    // 1. Role-based access control
    const auth = await requireRole(['admin'])(req)
    if (!auth.authorized) {
      return auth.errorResponse
    }

    // 2. Rate limiting for admin endpoints
    const limit = await rateLimit(100, 60000)(req)
    if (!limit.allowed) {
      return limit.errorResponse
    }

    // 3. Validate query parameters
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    
    // Validate search query
    const { validateSearchQuery } = await import('@/lib/validation/validators')
    const searchValidation = validateSearchQuery(search)
    if (!searchValidation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid search query' },
        { status: 400 }
      )
    }

    // 4. Fetch messages (use parameterized queries)
    // const messages = await Message.find({ 
    //   $or: [
    //     { fullName: { $regex: search, $options: 'i' } },
    //     { companyName: { $regex: search, $options: 'i' } },
    //   ]
    // })

    return NextResponse.json({
      success: true,
      data: [],
      message: 'Messages retrieved successfully',
    })

  } catch (error: any) {
    return handleApiError(error)
  }
}

