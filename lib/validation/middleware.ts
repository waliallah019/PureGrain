/**
 * Server-side Validation Middleware
 * Use this in API routes for consistent validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateFields, ValidationRule } from './validators'
import { sanitizeObject, preventSqlInjection, preventXss } from './security'
import logger from '@/lib/config/logger'

export interface ValidationConfig {
  rules: Record<string, ValidationRule>
  sanitize?: boolean
  logErrors?: boolean
}

/**
 * Validation middleware for API routes
 */
export function validateRequest(config: ValidationConfig) {
  return async (req: NextRequest, data: Record<string, any>): Promise<{
    isValid: boolean
    errors: Record<string, string>
    sanitizedData?: Record<string, any>
    errorResponse?: NextResponse
  }> => {
    const { rules, sanitize = true, logErrors = true } = config

    // Sanitize input
    let sanitizedData = sanitize ? sanitizeObject(data) : data

    // Validate fields
    const validation = validateFields(sanitizedData, rules)

    if (!validation.isValid) {
      if (logErrors) {
        logger.warn('Validation failed', {
          errors: validation.errors,
          endpoint: req.url,
          method: req.method,
        })
      }

      return {
        isValid: false,
        errors: validation.errors,
        errorResponse: NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: validation.errors,
          },
          { status: 400 }
        ),
      }
    }

    // Additional security checks
    for (const [key, value] of Object.entries(sanitizedData)) {
      if (typeof value === 'string') {
        // Check for SQL injection
        if (!preventSqlInjection(value)) {
          if (logErrors) {
            logger.warn('Potential SQL injection detected', {
              field: key,
              endpoint: req.url,
              ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            })
          }

          return {
            isValid: false,
            errors: { [key]: 'Invalid input detected' },
            errorResponse: NextResponse.json(
              {
                success: false,
                message: 'Invalid input detected',
              },
              { status: 400 }
            ),
          }
        }

        // Additional XSS protection
        sanitizedData[key] = preventXss(value)
      }
    }

    return {
      isValid: true,
      errors: {},
      sanitizedData,
    }
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest): Promise<{
    authorized: boolean
    errorResponse?: NextResponse
  }> => {
    // Get user role from session/token
    // This is a placeholder - implement based on your auth system
    const userRole = req.headers.get('x-user-role') || 'user'

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Unauthorized access attempt', {
        userRole,
        allowedRoles,
        endpoint: req.url,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      })

      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            message: 'Unauthorized access',
          },
          { status: 403 }
        ),
      }
    }

    return { authorized: true }
  }
}

/**
 * Rate limiting middleware (basic implementation)
 * For production, use a proper rate limiting library like express-rate-limit
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  return async (req: NextRequest): Promise<{
    allowed: boolean
    errorResponse?: NextResponse
  }> => {
    const identifier = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    
    const now = Date.now()
    const record = rateLimitMap.get(identifier)

    if (!record || now > record.resetTime) {
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })
      return { allowed: true }
    }

    if (record.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        endpoint: req.url,
      })

      return {
        allowed: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            message: 'Too many requests. Please try again later.',
          },
          { status: 429 }
        ),
      }
    }

    record.count++
    return { allowed: true }
  }
}

/**
 * Error handler that prevents sensitive information leakage
 */
export function handleApiError(error: any): NextResponse {
  // Log the full error internally
  logger.error('API error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  })

  // Return sanitized error to client
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return NextResponse.json(
    {
      success: false,
      message: isDevelopment 
        ? error.message || 'An error occurred'
        : 'An error occurred. Please try again later.',
      ...(isDevelopment && { details: error.message }),
    },
    { status: error.status || 500 }
  )
}

