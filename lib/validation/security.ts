/**
 * Security Utilities
 * Protection against common web vulnerabilities
 */

import { escapeHtml, sanitizeInput } from './validators'

/**
 * Prevent SQL Injection by validating and sanitizing input
 * Note: This is a client-side check. Always use parameterized queries on the server.
 */
export function preventSqlInjection(input: string): boolean {
  if (!input) return true

  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_|@@|@)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/gi,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return false
    }
  }

  return true
}

/**
 * Prevent XSS attacks by sanitizing user input
 */
export function preventXss(input: string): string {
  if (!input) return ''
  
  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
  
  // Escape remaining HTML
  sanitized = escapeHtml(sanitized)
  
  return sanitized
}

/**
 * Sanitize object recursively to prevent XSS
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitizeObject(sanitized[key] as any))
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }
  
  return sanitized
}

/**
 * Generate CSRF token (client-side helper)
 * Note: Actual CSRF protection should be implemented server-side
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token format
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  return /^[a-f0-9]{64}$/i.test(token)
}

/**
 * Prevent command injection
 */
export function preventCommandInjection(input: string): boolean {
  if (!input) return true

  const dangerousPatterns = [
    /[;&|`$(){}[\]]/g, // Command separators
    /(\b(cat|ls|pwd|cd|rm|mv|cp|chmod|chown|sudo|su)\b)/gi, // Common commands
    /(\$(\(|\{))/g, // Command substitution
    /(\||>|>>|2>&1)/g, // Pipes and redirects
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return false
    }
  }

  return true
}

/**
 * Prevent mass assignment by filtering allowed fields
 */
export function filterAllowedFields<T extends Record<string, any>>(
  data: Record<string, any>,
  allowedFields: (keyof T)[]
): Partial<T> {
  const filtered: Partial<T> = {}
  
  for (const field of allowedFields) {
    if (field in data) {
      filtered[field] = data[field] as T[Extract<keyof T, string>]
    }
  }
  
  return filtered
}

/**
 * Rate limiting helper (client-side check)
 * Note: Actual rate limiting should be implemented server-side
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const recentRequests = requests.filter((time) => now - time < this.windowMs)
    
    if (recentRequests.length >= this.maxRequests) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    
    return true
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { isValid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    }
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    }
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension .${extension} is not allowed`,
      }
    }
  }

  // Check for dangerous file names
  const dangerousPatterns = [/\.\./, /[<>:"|?*]/]
  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.name)) {
      return {
        isValid: false,
        error: 'File name contains invalid characters',
      }
    }
  }

  return { isValid: true }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 255)
}

