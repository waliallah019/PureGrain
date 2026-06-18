# PureGrain Agent Operating Guide

This file is the single source of truth for AI agents working in this repository.

## Goal

Keep project context, working rules, and change decisions in one place so future tasks need less rediscovery and fewer tool calls.

## Work Style For Credit Efficiency

1. Read this file first.
2. Link to existing docs instead of re-reading large files unless needed.
3. Prefer targeted reads and searches over full-repo scans.
4. Make the smallest safe change that satisfies the request.
5. Avoid repeated command runs when outputs are unchanged.
6. Batch related reads, then edit.
7. After each completed task, add a short entry to the Context and Change Log section.

## Primary Commands

- Install dependencies: `pnpm install`
- Dev server: `pnpm dev`
- Production build: `pnpm build`
- Start built app: `pnpm start`
- Lint: `pnpm lint`
- Type check (manual): `pnpm exec tsc --noEmit`

Important: `next.config.mjs` currently ignores TypeScript and ESLint build errors. Do not treat `pnpm build` as a type-safety signal.

## Architecture Snapshot

- App framework: Next.js App Router in `app/`
- API routes: `app/api/*/route.ts`
- Business logic: `lib/services/`
- Data models: `lib/models/`
- Validation schemas: `lib/validators/`
- Shared types: `types/`
- Reusable UI: `components/` and `components/ui/`
- Styling: Tailwind + global styles in `app/globals.css`

Preferred backend flow:

1. Route handler receives request.
2. Validate via `validateRequest` and Zod schema.
3. Delegate business logic to service layer.
4. Return normalized response and errors.

## Known Constraints

- Admin auth is currently simplified and not fully enforced server-side.
- Middleware allows admin routes in current implementation.
- Build can pass even with lint and type issues due to Next config.

## Canonical Docs (Link, Do Not Duplicate)

- [Backend automation and API patterns](BACKEND_AUTOMATION_GUIDE.md)
- [Validation and security implementation](VALIDATION_SECURITY_IMPLEMENTATION.md)
- [Design system and UI standards](DESIGN_SYSTEM.md)
- [Customer UI redesign status](CUSTOMER_UI_REDESIGN.md)
- [Wise setup history and notes](WISE_SETUP.md)
- [Wise testing flows](WISE_TESTING_GUIDE.md)
- [Validation package notes](lib/validation/README.md)

## Change Execution Checklist

Use this lightweight checklist before finishing any task.

1. Confirm touched files and why they changed.
2. Run only the minimum relevant verification commands.
3. Note risks, assumptions, and follow-ups.
4. Append one log entry below.

## Context And Change Log

Format:

- Date: YYYY-MM-DD
- Area: feature or subsystem
- Request: one sentence
- Changes: concise file list
- Validation: commands run and outcome
- Risks/Follow-up: optional

Entries:

- Date: 2026-06-18
- Area: agent customization
- Request: Create one central context file to reduce repeated discovery and manage AI credits.
- Changes: Added AGENTS.md.
- Validation: Manual review of package.json, next.config.mjs, middleware.ts, and documentation links.
- Risks/Follow-up: Keep this log updated after each completed task.

- Date: 2026-06-18
- Area: customer QA (Critical/High fixes)
- Request: Full customer-side QA per Pure Grain Exports B2B rules with safe fixes applied.
- Changes:
  - `app/custom-manufacturing/page.tsx` — `validateForm()` now requires specifications OR ≥1 design file.
  - `app/api/custom-manufacturing/route.ts` — added server-side block on empty submissions, MAX_FILE_SIZE_BYTES (25MB), MAX_TOTAL_FILES (5), MIME whitelist Set.
  - `lib/validators/customManufacturingValidator.ts` — comment noting route enforces spec/file rule.
  - `lib/validators/sampleRequestValidator.ts` — `.superRefine` enforcing HIDE 1-3 items / FINISHED_PRODUCT 1 item.
  - `components/quote-request/QuoteRequestForm.tsx` — removed false-positive `destinationCountry === countries[0]` guard.
  - `components/sample-request/SampleTrayBar.tsx` — "Review & Checkout" → "Review Sample Request".
- Validation: `get_errors` clean on all touched files.
- Risks/Follow-up: Auth, rate-limiting, and currency rounding flagged but not fixed (need user confirmation).

- Date: 2026-06-18
- Area: admin QA (Critical safe fix)
- Request: Audit admin surface for parity issues; apply safe high-impact fix to the worst offender.
- Changes:
  - `app/api/custom-manufacturing/[id]/route.ts` — moved `connectDB()` from module top into each handler; replaced raw `await req.json()` mass-assignment with strict Zod validation via `updateCustomManufacturingRequestSchema.shape.body.omit({ id: true }).strict()`; added Zod ID validation; replaced `console.error`/`error.message` with `logger.error` + `handleApiError`.
- Validation: `get_errors` clean; admin UI calls (`PUT { status }` and invoice form spreads) remain within the validated field set so no behavior change for legitimate admin traffic.
- Risks/Follow-up: All other admin API mutation routes still lack auth/role checks (see admin QA report). Module-level `connectDB()` pattern may exist elsewhere — needs sweep.

## Optional Next Customizations

If this file grows too large, split into focused customizations:

- `.github/instructions/frontend.instructions.md` for UI/page rules
- `.github/instructions/api.instructions.md` for route and service conventions
- `.github/skills/update-context-log/SKILL.md` to automate log entry updates