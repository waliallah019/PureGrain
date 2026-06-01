# Validation & Security System

Comprehensive validation and security utilities for the PureGrain platform.

## Overview

This validation system provides:
- **Client-side validation** for immediate user feedback
- **Server-side validation** as the source of truth
- **Security measures** against common web vulnerabilities
- **Consistent error handling** across the application

## Usage

### Client-Side Validation

#### Using the Hook

```tsx
import { useFormValidation } from '@/lib/validation/useFormValidation'
import { validateEmail, validateRequired, validateLength } from '@/lib/validation/validators'

function MyForm() {
  const { data, errors, handleChange, handleBlur, handleSubmit, isSubmitting } = useFormValidation(
    { email: '', name: '' },
    {
      rules: {
        email: {
          required: true,
          custom: validateEmail,
        },
        name: {
          required: true,
          minLength: 2,
          maxLength: 100,
          custom: (value) => validateRequired(value, 'Name'),
        },
      },
      onSubmit: async (sanitizedData) => {
        // Submit form
      },
    }
  )

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.email}
        onChange={(e) => handleChange('email')(e.target.value)}
        onBlur={handleBlur('email')}
      />
      {errors.email && <span>{errors.email}</span>}
      {/* ... */}
    </form>
  )
}
```

#### Direct Validation

```tsx
import { validateEmail, validateCompanyName, validatePhone } from '@/lib/validation/validators'

const emailResult = validateEmail(formData.email)
if (!emailResult.isValid) {
  setErrors({ email: emailResult.error })
}
```

### Server-Side Validation

#### In API Routes

```tsx
import { validateRequest } from '@/lib/validation/middleware'
import { validateEmail, validateRequired, validateLength } from '@/lib/validation/validators'

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  const validation = await validateRequest({
    rules: {
      email: {
        required: true,
        custom: validateEmail,
      },
      companyName: {
        required: true,
        minLength: 2,
        maxLength: 100,
        custom: (value) => validateRequired(value, 'Company name'),
      },
    },
    sanitize: true,
    logErrors: true,
  })(req, body)

  if (!validation.isValid) {
    return validation.errorResponse
  }

  // Use validation.sanitizedData for processing
  // ...
}
```

### Security Measures

#### Sanitize Input

```tsx
import { sanitizeInput, preventXss } from '@/lib/validation/security'

const userInput = '<script>alert("xss")</script>'
const sanitized = sanitizeInput(preventXss(userInput))
// Result: 'alert("xss")'
```

#### Prevent SQL Injection

```tsx
import { preventSqlInjection } from '@/lib/validation/security'

if (!preventSqlInjection(userInput)) {
  // Reject input
}
```

#### Filter Allowed Fields (Mass Assignment Prevention)

```tsx
import { filterAllowedFields } from '@/lib/validation/security'

const allowedFields = ['name', 'email', 'phone'] as const
const safeData = filterAllowedFields(userData, allowedFields)
```

### Role-Based Access Control

```tsx
import { requireRole } from '@/lib/validation/middleware'

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(['admin'])(req)
  
  if (!auth.authorized) {
    return auth.errorResponse
  }
  
  // Proceed with admin-only operation
}
```

### Rate Limiting

```tsx
import { rateLimit } from '@/lib/validation/middleware'

export async function POST(req: NextRequest) {
  const limit = await rateLimit(10, 60000)(req) // 10 requests per minute
  
  if (!limit.allowed) {
    return limit.errorResponse
  }
  
  // Process request
}
```

## Validation Rules

### Common Rules

- `required`: Field must have a value
- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `pattern`: Regex pattern to match
- `custom`: Custom validation function

### Available Validators

- `validateEmail(email: string)`
- `validatePhone(phone: string, required?: boolean)`
- `validateCompanyName(name: string)`
- `validatePersonName(name: string)`
- `validateAddress(address: string)`
- `validateCountry(country: string)`
- `validateTextArea(content: string, minLength?, maxLength?)`
- `validateSearchQuery(query: string)`
- `validateObjectId(id: string)`
- `validateNumber(value: any, min?, max?)`
- `validateUrl(url: string, required?: boolean)`

## Security Features

- **XSS Prevention**: Automatic HTML escaping and script tag removal
- **SQL Injection Prevention**: Pattern detection and validation
- **Command Injection Prevention**: Block dangerous shell commands
- **Mass Assignment Prevention**: Field filtering
- **Rate Limiting**: Request throttling
- **Input Sanitization**: Automatic cleaning of user input

## Error Handling

Errors are logged internally but sanitized before being sent to clients:

```tsx
import { handleApiError } from '@/lib/validation/middleware'

try {
  // API logic
} catch (error) {
  return handleApiError(error)
}
```

## Best Practices

1. **Always validate on both client and server**
2. **Use sanitize: true in production**
3. **Log validation failures for monitoring**
4. **Use parameterized queries (never concatenate SQL)**
5. **Filter allowed fields to prevent mass assignment**
6. **Implement rate limiting for public endpoints**
7. **Use role-based access control for admin functions**

