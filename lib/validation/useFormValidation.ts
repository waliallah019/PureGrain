"use client"

import { useState, useCallback } from 'react'
import { ValidationRule, validateField, validateFields } from './validators'
import { sanitizeInput, preventXss } from './security'

export interface UseFormValidationOptions {
  rules: Record<string, ValidationRule>
  sanitize?: boolean
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions
) {
  const { rules, sanitize = true, onSubmit } = options
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sanitizeObject = useCallback((obj: T): T => {
    const sanitized = { ...obj }
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitizeInput(preventXss(sanitized[key] as any)) as any
      }
    }
    return sanitized
  }, [])

  const validate = useCallback(
    (fieldName?: string): boolean => {
      if (fieldName) {
        // Validate single field
        const rule = rules[fieldName]
        if (!rule) return true

        let value = data[fieldName]
        if (sanitize && typeof value === 'string') {
          value = sanitizeInput(preventXss(value)) as any
        }

        const result = validateField(value, rule, fieldName)
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [fieldName]: result.error || 'Invalid value' }))
          return false
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[fieldName]
            return newErrors
          })
          return true
        }
      } else {
        // Validate all fields
        let sanitizedData = sanitize ? sanitizeObject(data) : data
        const validation = validateFields(sanitizedData, rules)
        setErrors(validation.errors)
        return validation.isValid
      }
    },
    [data, rules, sanitize, sanitizeObject]
  )

  const handleChange = useCallback(
    (name: keyof T) => (value: any) => {
      let sanitizedValue = value
      if (sanitize && typeof value === 'string') {
        sanitizedValue = sanitizeInput(preventXss(value))
      }

      setData((prev) => ({ ...prev, [name]: sanitizedValue }))
      
      // Clear error when user starts typing
      if (errors[name as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name as string]
          return newErrors
        })
      }
    },
    [errors, sanitize]
  )

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      validate(name as string)
    },
    [validate]
  )

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      
      setIsSubmitting(true)
      
      // Validate all fields
      const isValid = validate()
      
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      try {
        let sanitizedData = sanitize ? sanitizeObject(data) : data
        await onSubmit?.(sanitizedData)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [data, validate, onSubmit, sanitize]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialData])

  return {
    data,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setData,
  }
}

