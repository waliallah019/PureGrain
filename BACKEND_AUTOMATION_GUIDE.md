# PureGrain Backend Review and Selenium Automation Guide

## Purpose

This document explains how the current backend works, where data enters the system, what side effects happen after each submission, and how to create a Selenium script that inserts data safely and predictably.

It is based on the current source code in the repository, not on intended architecture.

## Executive Summary

The application is a Next.js App Router project that exposes its backend through route handlers under `app/api`. The backend uses MongoDB through Mongoose, stores media in Cloudinary, sends emails with Nodemailer, and supports bank-transfer payment confirmation flows.

The backend is organized around a common pattern:

1. A page or admin modal sends JSON or `multipart/form-data` to an API route.
2. The route connects to MongoDB through `lib/config/db.ts`.
3. The route validates the input through Zod schemas in `lib/validators` and the helper in `lib/middleware/validateRequest.ts`.
4. The route calls a service in `lib/services`.
5. The service writes to a Mongoose model in `lib/models`.
6. The service or route may create notifications, upload files, generate PDFs, or send emails.

For Selenium, the most stable UI entrypoints today are:

- `/admin-login` for admin access
- `/quote-request` for quote submissions
- `/custom-manufacturing` for custom manufacturing submissions
- `/sample-request` for sample submissions with bank-transfer instructions and payment confirmation

The `/contact` page submits to `/api/contact` and creates backend message records.

## High-Level Backend Architecture

### Platform

- Framework: Next.js 15 App Router
- Runtime style: server routes in `app/api/**/route.ts`
- Database: MongoDB via Mongoose
- File storage: Cloudinary for product, raw leather, and custom manufacturing uploads
- Payment proof storage: Cloudinary URLs saved on sample/quote requests
- Validation: Zod schemas in `lib/validators`
- Email: Nodemailer through `lib/utils/sendEmail.ts`
- Payments: bank transfer details + tokenized payment confirmation submission

### Cross-Cutting Files

- `lib/config/db.ts`: cached MongoDB connection
- `lib/middleware/validateRequest.ts`: route validation helper that combines `body`, `query`, and a limited `params` extraction strategy
- `lib/utils/errorHandler.ts`: normalizes API error responses
- `lib/config/logger.ts`: application logging
- `lib/config/cloudinary.ts`: Cloudinary uploader configuration
- `middleware.ts`: intended admin middleware, but currently does not enforce auth

## Authentication and Access Control

### Current Reality

Authentication is effectively client-side only.

- The admin login UI uses `useAuth()` from `lib/auth.tsx`.
- `lib/auth.tsx` accepts exactly one hardcoded credential pair:
  - email: `admin@puregrain.com`
  - password: `admin123`
- On successful login, the app stores `{ email, role: "admin" }` in `localStorage` under `admin-user`.
- The route `app/api/login/route.ts` returns the same hardcoded success response, but the current login page does not need a real server-issued session.
- `middleware.ts` matches `/admin/:path*`, but always returns `NextResponse.next()`.

### Consequences

- There is no server-side session.
- There is no JWT.
- There is no cookie-based auth.
- Admin API routes are not protected.
- Anyone who can hit the API can call admin-oriented endpoints if they know the route shape.

### Selenium Impact

You can log in through the UI normally, but you can also speed up admin automation by writing `admin-user` directly into local storage before opening `/admin`.

Example local storage payload:

```json
{"email":"admin@puregrain.com","role":"admin"}
```

That approach matches the current frontend behavior exactly.

## Domain-by-Domain Backend Logic

### 1. Quote Requests

#### Entry points

- Public UI: `/quote-request`
- API list/create: `app/api/quote-requests/route.ts`
- API detail/update: `app/api/quote-requests/[id]/route.ts`
- Invoice generation: `app/api/quote-requests/[id]/invoice/route.ts`

#### Main data flow

1. The quote form builds a JSON payload and posts to `/api/quote-requests`.
2. The route validates the payload with `createQuoteRequestCombinedSchema`.
3. `quoteService.createQuoteRequest()`:
   - generates an 8-character request number with `nanoid`
   - creates a `QuoteRequest` document
   - creates an admin notification
   - sends a confirmation email to the customer
4. Admin users retrieve requests with filters from `GET /api/quote-requests`.
5. Admin updates status and pricing via `PATCH /api/quote-requests/[id]`.
6. When approved, an invoice can be generated via `PATCH /api/quote-requests/[id]/invoice`.
7. Invoice generation:
   - checks the quote exists and is approved
   - creates an `Invoice`
   - calculates subtotal, tax, shipping, and total
   - generates a PDF
   - emails the invoice to the customer
   - creates a payment confirmation token on the quote

#### Stored business data

Quote records carry customer identity, product identity, quantity, destination, comments, status, pricing data, tracking data, and payment-related fields.

#### Automation note

This is the easiest customer-side flow to automate with Selenium because the form fields have stable IDs and the submission is a single API call.

### 2. Sample Requests and Bank Transfer Payment Flow

#### Entry points

- Public UI: `/sample-request`
- API list/create: `app/api/sample-requests/route.ts`
- API detail/update: `app/api/sample-requests/[id]/route.ts`

#### Main data flow

1. The sample request page collects company, shipping, sample, and business details.
2. On payment initiation, the page displays bank-transfer details for the calculated shipping fee.
3. After the user clicks confirm payment, the page posts the sample request to `/api/sample-requests` with payment status set to `pending`.
6. `sampleService.createSampleRequest()`:
   - generates an 8-character request number
   - creates the `SampleRequest`
    - defaults payment status to `pending` unless provided
    - sends a payment-confirmation-link reminder email when token exists
   - creates admin notification
4. The user can submit payment proof immediately or later via the emailed confirmation link.
5. Later updates use `sampleService.updateSampleRequest()` and can trigger status emails and tracking emails.

#### Automation note

This flow is a two-step UI path:

1. view bank details
2. create sample request and continue to tokenized payment confirmation

If your goal is test-data insertion, this is a good candidate for hybrid automation:

- Selenium for the browser flow and validation
- direct API assertions for the resulting records

### 3. Custom Manufacturing Requests

#### Entry points

- Public UI: `/custom-manufacturing`
- API list/create: `app/api/custom-manufacturing/route.ts`
- API detail/update/delete: `app/api/custom-manufacturing/[id]/route.ts`

#### Main data flow

1. The UI submits `multipart/form-data`.
2. The route splits text fields and uploaded files.
3. Text fields are validated with `createCustomManufacturingRequestSchema`.
4. Design files are uploaded to Cloudinary under `custom-manufacturing-designs`.
5. `customManufacturingService.createRequest()` stores the request.
6. A notification is created for admin.

#### Automation note

This is the easiest file-upload flow to automate in Selenium because it uses a standard `<input type="file">` and then posts a single multipart request.

### 4. Contact and Messages

#### Backend entry points

- Backend contact route: `app/api/contact/route.ts`
- Admin list: `app/api/messages/route.ts`
- Admin detail/update/delete: `app/api/messages/[id]/route.ts`

#### Main data flow on the backend

If `/api/contact` is called directly:

1. request body is validated with `contactFormSchema`
2. `messageService.createMessage()` creates a `Message`
3. priority is derived from inquiry type
4. an admin notification is created

#### Automation note

You can use Selenium on `/contact` to create backend message records through `/api/contact`.

### 5. Notifications

#### Entry points

- `GET /api/notifications`
- `PATCH /api/notifications` to mark all as read
- `PATCH /api/notifications/[id]`
- `DELETE /api/notifications/[id]`
- cleanup cron: `app/api/cron/cleanup-notifications/route.ts`

#### Behavior

Notifications are side effects, not a primary data-entry surface. They are generated by quote creation, sample creation, message creation, invoice sending, and some status updates.

### 6. Finished Products

#### Entry points

- Admin UI uses `components/ProductForm.tsx`
- API list/create: `app/api/finished-products/route.ts`
- API detail/update/delete: `app/api/finished-products/[id]/route.ts`
- image removal: `app/api/finished-products/[id]/remove-images/route.ts`
- product types: `app/api/product-types/route.ts` and `[id]/route.ts`

#### Main data flow

1. Admin form builds `multipart/form-data`.
2. Route parses text fields and files.
3. Text fields are validated.
4. Images upload to Cloudinary under `finished-products`.
5. `finishedProductService.createProduct()` stores the product.

#### Business behavior

- Filtering supports type, color, material, category, availability, active/archive flags, featured flag, and sample availability.
- Deletion also attempts Cloudinary cleanup.

#### Automation note

This is a good Selenium target if your goal is inventory seeding from the admin UI.

### 7. Raw Leather

#### Entry points

- Admin UI uses `components/RawLeatherForm.tsx`
- API list/create: `app/api/raw-leather/route.ts`
- API detail/update/delete: `app/api/raw-leather/[id]/route.ts`
- image removal: `app/api/raw-leather/[id]/remove-images/route.ts`
- leather types: `app/api/raw-leather-types/route.ts` and `[id]/route.ts`

#### Main data flow

1. Admin form submits `multipart/form-data`.
2. The route parses arrays, booleans, images, and `priceTier` JSON.
3. Images upload to Cloudinary under `raw-leather`.
4. `rawLeatherService.createRawLeather()` stores the record.

#### Automation note

Also a strong Selenium candidate, especially if you need to populate catalog data with images and multiple price tiers.

### 8. Payment Confirmations

#### Entry points

- Public tokenized submit: `app/api/payment-confirmations/route.ts`
- Admin review: `app/api/admin/payment-confirmations/route.ts`

#### Main data flow

1. Customer receives a payment confirmation link generated during invoice handling.
2. Customer uploads proof through a tokenized form flow.
3. The route validates token, request type, amount, payment method, and proof file.
4. The proof file is uploaded to Cloudinary and stored as a secure URL.
5. The matching `QuoteRequest` or `SampleRequest` is updated with confirmation metadata.
6. Admin review endpoint can approve or reject the confirmation.
7. Approval uses service methods to push the main request state forward and trigger emails.

#### Automation note

This is not a first-choice Selenium seed route unless you are specifically testing payment-proof handling.

## Review Findings

### Critical

1. Admin routes are not protected.
   `middleware.ts` matches `/admin/:path*` but unconditionally allows access. There is no server-side auth barrier for admin pages or admin API usage.

2. Admin credentials are hardcoded in multiple places.
   The same demo credentials appear in the UI, in client auth logic, and in the login API. This is not only insecure, it makes browser automation too permissive compared with a production login model.

3. Admin payment confirmation review is unauthenticated.
   `app/api/admin/payment-confirmations/route.ts` reads and updates confirmations by raw IDs with no auth or role check.

### High

4. The public contact page does not reach the backend.
   `/contact` renders a form, but it calls `e.preventDefault()` and does not post to `/api/contact`. Selenium on this page will not create records.

5. Customer portal links in outgoing quote and sample emails point to routes that do not exist in this workspace.
   The services build links under `/customer/quotes/...` and `/customer/samples/...`, but there is no `app/customer/**` tree.

### Medium

6. Validation plumbing is inconsistent across routes.
   `lib/middleware/validateRequest.ts` contains route-shape assumptions for dynamic params, so several routes manually validate IDs or merge params into body to work around it. This increases fragility and makes request handling less uniform.

7. Payment confirmation proofs are stored locally under `public/uploads`, while most other uploaded assets use Cloudinary.
   This is workable for local hosting, but it is operationally inconsistent with the rest of the asset strategy.

## Selenium Strategy

## Decide What You Are Seeding

Use Selenium only for data that genuinely needs UI coverage.

Best Selenium candidates:

- quote requests
- custom manufacturing requests
- admin product creation
- admin raw leather creation

Use API seeding instead of Selenium when:

- you need large volumes of test data
- you need deterministic setup across environments
- the UI introduces external dependencies or long-running async states

## Recommended Automation Patterns

### Pattern A: Pure browser automation

Use this when you want to test the exact user path.

- Open the page
- fill fields by stable `id`
- upload files through the hidden file input if needed
- submit
- assert success toast, redirect, or resulting admin list entry

### Pattern B: Hybrid automation

Use Selenium for the UI path but verify data through API calls or the database.

- submit via browser
- call admin list endpoint or open admin screen
- assert the new row exists

### Pattern C: Local-storage admin login shortcut

Use this when you only need admin pages and do not care about login UX.

- open the site once
- inject `localStorage['admin-user']`
- refresh or navigate to `/admin`

This matches current app behavior because the frontend auth provider only checks local storage.

## Stable UI Selectors You Can Use

### Admin login

Page: `/admin-login`

- `#email`
- `#password`

### Quote request form

Page: `/quote-request`

- `#companyName`
- `#contactPerson`
- `#email`
- `#phone`
- `#specifications`

The country and category fields use Radix Select, so they are not standard `<select>` elements. In Selenium, open the trigger button and click the desired option text.

### Sample request form

Page: `/sample-request`

- `#companyName`
- `#contactPerson`
- `#email`
- `#phone`
- `#address`

Other fields also use Radix Select components.

### Custom manufacturing form

Page: `/custom-manufacturing`

- `#companyName`
- `#contactPerson`
- `#email`
- `#phone`
- `#estimatedQuantity`
- `#specifications`
- file input for design uploads

## Selenium Example in Python

This example uses Python Selenium and targets two flows:

- admin login
- quote request creation

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE_URL = "http://localhost:3000"


def build_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    return webdriver.Chrome(options=options)


def wait_for(driver, condition, timeout=15):
    return WebDriverWait(driver, timeout).until(condition)


def login_admin(driver):
    driver.get(f"{BASE_URL}/admin-login")

    wait_for(driver, EC.visibility_of_element_located((By.ID, "email"))).send_keys("admin@puregrain.com")
    driver.find_element(By.ID, "password").send_keys("admin123")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait_for(driver, EC.url_contains("/admin"))


def open_radix_select_and_choose(driver, trigger_text_hint, option_text):
    trigger = driver.find_element(
        By.XPATH,
        f"//button[contains(., '{trigger_text_hint}') or @role='combobox'][1]"
    )
    driver.execute_script("arguments[0].click();", trigger)
    option = wait_for(
        driver,
        EC.element_to_be_clickable((By.XPATH, f"//*[contains(@role, 'option') and normalize-space()='{option_text}'] | //div[normalize-space()='{option_text}']"))
    )
    driver.execute_script("arguments[0].click();", option)


def create_quote_request(driver):
    driver.get(f"{BASE_URL}/quote-request")

    wait_for(driver, EC.visibility_of_element_located((By.ID, "companyName"))).send_keys("Acme Leather Trading")
    driver.find_element(By.ID, "contactPerson").send_keys("Sarah Ahmed")
    driver.find_element(By.ID, "email").send_keys("sarah.ahmed@example.com")
    driver.find_element(By.ID, "phone").send_keys("+971501234567")

    # Radix Select fields need click-based interaction.
    # Adjust option text to values that exist in your environment.
    open_radix_select_and_choose(driver, "Select destination country", "United Arab Emirates")
    open_radix_select_and_choose(driver, "Select product category", "Finished Products")
    open_radix_select_and_choose(driver, "Select business type", "Importer")

    quantity = driver.find_element(By.NAME, "quantity")
    quantity.clear()
    quantity.send_keys("250")

    driver.find_element(By.ID, "specifications").send_keys(
        "Need private-label leather wallets in tan and black. MOQ test request."
    )

    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait_for(driver, EC.url_contains("/catalog"))


if __name__ == "__main__":
    driver = build_driver()
    try:
        login_admin(driver)
        create_quote_request(driver)
    finally:
        driver.quit()
```

## Faster Admin Shortcut Example

If you only need admin screens, skip the login form entirely:

```python
driver.get(BASE_URL)
driver.execute_script(
    "window.localStorage.setItem('admin-user', arguments[0]);",
    '{"email":"admin@puregrain.com","role":"admin"}'
)
driver.get(f"{BASE_URL}/admin")
```

## Flow-Specific Guidance

### If you want to seed customer inquiries

Use `/quote-request` and `/custom-manufacturing` first. These flows are simpler and less dependent on third-party behavior.

### If you want to seed sample requests

The sample page now uses bank-transfer instructions in-app and tokenized payment-confirmation links. No Wise setup is required.

Recommended non-production setup:

- valid `NEXT_PUBLIC_BACKEND_API_URL`
- working MongoDB connection
- optional bank detail display env vars (for UI realism):
    - `NEXT_PUBLIC_BANK_NAME`
    - `NEXT_PUBLIC_BANK_ACCOUNT_NAME`
    - `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER`
    - `NEXT_PUBLIC_BANK_IBAN`
    - `NEXT_PUBLIC_BANK_SWIFT`
    - `NEXT_PUBLIC_BANK_ROUTING_NUMBER`
    - `NEXT_PUBLIC_BANK_BENEFICIARY_ADDRESS`

### If you want to seed inventory

Target admin modals backed by:

- `components/ProductForm.tsx`
- `components/RawLeatherForm.tsx`

These flows are upload-heavy, so Selenium can populate images using `send_keys()` on the file input with absolute file paths.

## Recommended Test Data Design

Use unique markers in each seeded record so the automation can find and clean up its own data.

Recommended pattern:

- company name prefix: `SELENIUM-YYYYMMDD-HHMMSS`
- email alias: `qa+<timestamp>@example.com`
- product names with batch IDs

This makes search-based verification easier in admin lists.

## Environment Checklist Before Running Selenium

- MongoDB is reachable through `MONGO_URI`
- `NEXT_PUBLIC_BACKEND_API_URL` points to the same app you are automating
- Cloudinary credentials exist if you are testing file uploads for products or custom manufacturing
- email settings exist if you care about email side effects
- bank detail env vars are configured if you are automating sample requests

## Practical Recommendation

If your primary goal is inserting data into the system, not testing every pixel of the UI, use this split:

1. Selenium for admin login and one end-to-end smoke path per feature.
2. API-based seed scripts for bulk data creation.
3. Selenium verification against admin tables and detail views.

That gives you speed, reliability, and realistic coverage without overfitting to the UI.

## Suggested Next Build Step

The next useful artifact would be a project-specific automation script that targets exactly one of these flows:

- quote request seeding
- custom manufacturing seeding with file uploads
- admin product creation
- admin raw leather creation

If you want, build the Selenium script against one of those flows first and keep the selector strategy aligned with this document.