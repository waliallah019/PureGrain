# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run all commands from the `PureGrain/` directory (the Next.js project root — the repo root only contains this one project). Package manager is pnpm (see `pnpm-lock.yaml`).

```bash
pnpm dev      # start dev server (Next.js App Router)
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # next lint
```

There is no test suite/runner configured in this project. `next.config.mjs` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`, so `pnpm build` will succeed even with lint/type errors — don't rely on a clean build as a correctness signal, check `tsc`/`next lint` output directly if you need that guarantee.

## Architecture

Next.js 15 App Router app (React 19) that is both the customer-facing site and the admin backend, backed by MongoDB/Mongoose. There is no separate backend service — everything lives under `app/api/**/route.ts`.

### Request flow (backend)

Every API route generally follows this pipeline:

1. Public page or admin component sends JSON or `multipart/form-data` to a route in `app/api/**`.
2. Route calls `connectDB()` from `lib/config/db.ts` (cached global Mongoose connection).
3. Route validates input via a Zod schema from `lib/validators/*Validator.ts`, run through `lib/middleware/validateRequest.ts` (`validateRequest(schema, req, parsedBody)` — combines `body`/`query`/a best-effort `params` extraction into one object for `schema.parseAsync`).
4. Route delegates to a service in `lib/services/*Service.ts`, which performs the actual Mongoose read/write.
5. The service may also: create a `Notification` doc, upload files to Cloudinary (`lib/config/cloudinary.ts`), generate a PDF (`lib/utils/invoicePdfGenerator.ts`), or send email (`lib/utils/sendEmail.ts`, Nodemailer).
6. Errors are normalized through `lib/utils/errorHandler.ts` (`handleApiError`), which special-cases `ZodError` and any thrown error carrying a `statusCode`.

There is a second, newer, largely-unwired validation/security layer in `lib/validation/` (`validators.ts`, `security.ts`, `middleware.ts`, `useFormValidation.ts` — XSS/SQLi/CSRF helpers, rate limiting, role checks). Most existing routes still use the older `lib/middleware/validateRequest.ts` + `lib/validators/` pair described above; `lib/validation/` is the intended replacement per `VALIDATION_SECURITY_IMPLEMENTATION.md` but has only been partially adopted. Check which pattern a given route already uses before changing it, and don't assume `lib/validation/` is live everywhere just because it exists.

Domain layout is consistent across features — for a domain called `X` expect: `lib/models/X.ts` (Mongoose schema), `lib/validators/XValidator.ts` (Zod), `lib/services/XService.ts` (business logic), `app/api/X/route.ts` (list/create), `app/api/X/[id]/route.ts` (detail/update/delete). Current domains: quote-requests, sample-requests (model file is lowercase `sampleRequestModel.ts`, service is `sampleService.ts`), custom-manufacturing, finished-products, raw-leather, product-types, raw-leather-types, messages/contact, notifications, blogs, payment-confirmations.

### Auth reality (not aspirational)

Authentication is client-side-only and does not protect the API:

- Admin UI at `/admin-login` uses `useAuth()` from `lib/auth.tsx`, a React Context that checks one hardcoded credential pair in-code and, on success, writes `{ email, role: "admin", expiresAt }` to `localStorage["admin-user"]` — expires 24h after login (checked on load and every 60s while a tab stays open) rather than persisting forever. There is still no server session, JWT, or cookie — this is client-side expiry only, not real access revocation.
- `app/api/login/route.ts` exists with a *different* hardcoded credential pair than `lib/auth.tsx` and is not what the admin login page actually calls — treat it as effectively dead/legacy code, not the source of truth for admin credentials.
- The real admin section lives at `app/admin-ahmza/**` (not `/admin`). `middleware.ts` matches `/admin-ahmza/:path*` but currently always calls `NextResponse.next()` — it does not enforce anything.
- Because of this, every `app/api/**` route is reachable by anyone who knows the URL shape, including admin-oriented ones (e.g. `app/api/admin/payment-confirmations`). Don't assume an "admin" route is actually access-controlled — if you're asked to add real auth, this is greenfield, not a bug fix.

### Payments

Two customer-money flows coexist:

- **Sample requests**: bank-transfer only. User submits the sample request, sees bank details rendered from `NEXT_PUBLIC_BANK_*` env vars, pays out-of-band, then confirms via a tokenized link at `/payment-confirmation/[token]` which posts to `app/api/payment-confirmations`. Admin approves/rejects at `app/api/admin/payment-confirmations`. Wise-based transfer creation (`create-wise-transfer`/`check-wise-transfer`) was removed — `WISE_SETUP.md` and `WISE_TESTING_GUIDE.md` are marked deprecated and describe the old flow only for historical context; some `WISE_*` env vars still exist in `.env.local` but the routes that used them are gone.
- **Quote requests**: Stripe (`@stripe/stripe-js`, `stripe` packages) and PayPal (`app/api/paypal/**`, `lib/services/paypalService.ts`) are both present in dependencies/routes for invoice payment — check the relevant service/route directly rather than assuming which is wired into a given page, as this is mixed.

Payment confirmation proof files are stored under `public/uploads` locally, while every other upload path (products, raw leather, custom-manufacturing designs) goes to Cloudinary — this is a known inconsistency, not a pattern to replicate for new upload features.

### Frontend structure

- `app/` — route segments per page/feature; customer-facing pages at the root (`quote-request`, `sample-request`, `custom-manufacturing`, `contact`, `catalog`, `products`, etc.), admin under `app/admin-ahmza/**` mirroring the domain list above (products, raw-leather, quotes, samples, messages, notifications, blogs, custom-manufacturing, reports, settings, orders).
- `components/ui/` — shadcn/ui primitives (Radix-based); configured via `components.json` (`style: default`, `baseColor: neutral`, no class prefix, icon library `lucide`). Use the existing `@/components/ui/*` components and `cn()` from `@/lib/utils` rather than hand-rolling styled primitives.
- `components/forms/` — `EnhancedFormField` and `FormSection`, the intended building blocks for B2B-style forms (icons, tooltips, helper text, inline stats) per `DESIGN_SYSTEM.md`. Several public forms (quote request, contact, custom manufacturing) have *not* been migrated to these yet — check `CUSTOMER_UI_REDESIGN.md`'s "Remaining Work" section before assuming a form already uses them.
- Radix `Select` is used instead of native `<select>` throughout forms (country, category, business type, etc.) — relevant if writing browser automation or tests: interact via the trigger button + option click, not `select.value`.
- `lib/currency/` — `CurrencyContext.tsx` + `exchangeRates.ts` provide multi-currency display (`NEXT_PUBLIC_BASE_CURRENCY`, `app/api/exchange-rates`, `app/api/detect-currency`); `components/CurrencySwitcher.tsx` and `components/PriceDisplay.tsx` are the consumer-facing pieces.
- Path aliases (`tsconfig.json`): `@/*`, `@/lib/*`, `@/components/*`, `@/types/*`.

### Automation / seeding

`scripts/selenium_seed.py` and `BACKEND_AUTOMATION_GUIDE.md` document Selenium-based data seeding against the live app (stable form field IDs, admin `localStorage` login shortcut, recommended `SELENIUM-YYYYMMDD-HHMMSS` naming for test records so they're identifiable/cleanable). `scripts/seedShippingRates.ts` seeds the `ShippingRate` collection directly. Read `BACKEND_AUTOMATION_GUIDE.md` before writing new seed/automation scripts for per-domain entry points and stable selectors — but verify specifics against current code first: e.g. the guide claims `/contact` never actually posts to `/api/contact`, which is no longer true as of this writing (`app/contact/page.tsx`'s `handleSubmit` does call `fetch("/api/contact", ...)`), so treat that guide as a good map, not ground truth.
