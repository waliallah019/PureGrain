/**
 * Centralized Validation Utilities
 * Provides consistent validation across client and server
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => ValidationResult
  message?: string
}

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  // Additional check for common email issues
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' }
  }

  return { isValid: true }
}

/**
 * Validate phone number (international format)
 */
export function validatePhone(phone: string, required: boolean = false): ValidationResult {
  if (!phone) {
    if (required) {
      return { isValid: false, error: 'Phone number is required' }
    }
    return { isValid: true }
  }

  // Allow international format: +1234567890, (123) 456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Please enter a valid phone number' }
  }

  if (phone.length > 20) {
    return { isValid: false, error: 'Phone number is too long' }
  }

  return { isValid: true }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  return { isValid: true }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  minLength?: number,
  maxLength?: number,
  fieldName: string = 'Field'
): ValidationResult {
  if (minLength !== undefined && value.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }
  if (maxLength !== undefined && value.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters` }
  }
  return { isValid: true }
}

/**
 * Validate against pattern
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  errorMessage: string = 'Invalid format'
): ValidationResult {
  if (!pattern.test(value)) {
    return { isValid: false, error: errorMessage }
  }
  return { isValid: true }
}

/**
 * Validate URL
 */
export function validateUrl(url: string, required: boolean = false): ValidationResult {
  if (!url) {
    if (required) {
      return { isValid: false, error: 'URL is required' }
    }
    return { isValid: true }
  }

  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' }
  }
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id: string): ValidationResult {
  if (!id) {
    return { isValid: false, error: 'ID is required' }
  }

  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  if (!objectIdRegex.test(id)) {
    return { isValid: false, error: 'Invalid ID format' }
  }

  return { isValid: true }
}

/**
 * Validate numeric value
 */
export function validateNumber(
  value: any,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): ValidationResult {
  const num = Number(value)
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` }
  }
  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` }
  }
  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} must be no more than ${max}` }
  }
  return { isValid: true }
}

/**
 * Validate company name
 */
export function validateCompanyName(name: string): ValidationResult {
  const required = validateRequired(name, 'Company name')
  if (!required.isValid) return required

  const length = validateLength(name, 2, 100, 'Company name')
  if (!length.isValid) return length

  // Allow letters, numbers, spaces, hyphens, apostrophes, and common business suffixes
  const pattern = /^[a-zA-Z0-9\s\-'.,&()]+$/
  const patternCheck = validatePattern(
    name,
    pattern,
    'Company name contains invalid characters'
  )
  if (!patternCheck.isValid) return patternCheck

  return { isValid: true }
}

/**
 * Validate person name
 */
export function validatePersonName(name: string): ValidationResult {
  const required = validateRequired(name, 'Name')
  if (!required.isValid) return required

  const length = validateLength(name, 2, 100, 'Name')
  if (!length.isValid) return length

  // Allow letters, spaces, hyphens, apostrophes
  const pattern = /^[a-zA-Z\s\-'.,]+$/
  const patternCheck = validatePattern(
    name,
    pattern,
    'Name contains invalid characters'
  )
  if (!patternCheck.isValid) return patternCheck

  return { isValid: true }
}

/**
 * Validate address
 */
export function validateAddress(address: string): ValidationResult {
  const required = validateRequired(address, 'Address')
  if (!required.isValid) return required

  const length = validateLength(address, 10, 500, 'Address')
  if (!length.isValid) return length

  return { isValid: true }
}

/**
 * Validate country name
 */
export function validateCountry(country: string): ValidationResult {
  const required = validateRequired(country, 'Country')
  if (!required.isValid) return required

  // Allow letters, spaces, hyphens, parentheses
  const pattern = /^[a-zA-Z\s\-()]+$/
  const patternCheck = validatePattern(
    country,
    pattern,
    'Country name contains invalid characters'
  )
  if (!patternCheck.isValid) return patternCheck

  return { isValid: true }
}

/**
 * Validate text area content
 */
export function validateTextArea(
  content: string,
  minLength?: number,
  maxLength: number = 5000,
  fieldName: string = 'Message'
): ValidationResult {
  if (minLength !== undefined) {
    const required = validateRequired(content, fieldName)
    if (!required.isValid) return required
  }

  const length = validateLength(content, minLength, maxLength, fieldName)
  if (!length.isValid) return length

  return { isValid: true }
}

/**
 * Validate search query (prevent injection attacks)
 */
export function validateSearchQuery(query: string): ValidationResult {
  if (!query) {
    return { isValid: true } // Empty search is valid
  }

  const length = validateLength(query, 1, 200, 'Search query')
  if (!length.isValid) return length

  // Prevent SQL injection patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return { isValid: false, error: 'Invalid search query' }
    }
  }

  return { isValid: true }
}

/**
 * Generic field validator using rules
 */
export function validateField(
  value: any,
  rules: ValidationRule,
  fieldName: string = 'Field'
): ValidationResult {
  // Required check
  if (rules.required) {
    const required = validateRequired(value, fieldName)
    if (!required.isValid) return required
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return { isValid: true }
  }

  // Type check for string validations
  if (typeof value !== 'string' && (rules.minLength || rules.maxLength || rules.pattern)) {
    return { isValid: false, error: `${fieldName} must be a string` }
  }

  // Length validation
  if (rules.minLength || rules.maxLength) {
    const length = validateLength(value, rules.minLength, rules.maxLength, fieldName)
    if (!length.isValid) return length
  }

  // Pattern validation
  if (rules.pattern) {
    const pattern = validatePattern(value, rules.pattern, rules.message || 'Invalid format')
    if (!pattern.isValid) return pattern
  }

  // Custom validation
  if (rules.custom) {
    const custom = rules.custom(value)
    if (!custom.isValid) return custom
  }

  return { isValid: true }
}

/**
 * Validate multiple fields
 */
export function validateFields(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const [fieldName, rule] of Object.entries(rules)) {
    const result = validateField(data[fieldName], rule, fieldName)
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

