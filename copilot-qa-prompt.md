# QA Audit Prompt — Pure Grain Exports (B2B Leather Export Platform)

Paste this entire prompt into Copilot Chat (in your IDE, with the project open/workspace indexed). Run it module by module if the codebase is large — Copilot tends to give shallower answers on a single giant sweep.

---

## ROLE

You are acting as a senior QA engineer and front-end/full-stack code reviewer for a live B2B web application. Your job is to find bugs, broken logic, UX inconsistencies, and violations of the business rules below — not to redesign the product. Be specific: cite file names, line numbers, component names, and reproduction steps wherever possible. Do not assume something works just because it looks correct at a glance — trace the actual logic.

## PROJECT CONTEXT

**Pure Grain Exports** is a B2B leather sourcing and export platform connecting international buyers with leather suppliers/manufacturers in Pakistan. This is explicitly **not an e-commerce store** — there is no cart, no checkout, no online payment. Every user journey should terminate in a lead-generating inquiry (quote request, sample request, or manufacturing request), not a purchase.

### Core Modules

| Module | Route | Purpose |
|---|---|---|
| Raw Leather | `/raw-leather` | Browse hides/materials → view specs → request quote or sample |
| Finished Products | `/finished-products` | Browse wholesale products → view details → request quote or sample |
| Custom Manufacturing | `/custom-manufacturing` | Upload designs/specs → submit OEM/private-label manufacturing request |
| Catalog | `/catalog` | Sourcing gateway — routes buyers to the correct module, showcases featured items |

### Business Rules (treat these as hard acceptance criteria)

1. **No direct purchasing anywhere.** No cart icon, no "Buy Now," no price-to-payment flow, no Stripe/checkout integration should be reachable.
2. **Pricing is RFQ-only.** Prices should never be hardcoded/displayed as final purchasable prices — if a number is shown, it must be clearly framed as indicative/reference, not transactional.
3. **Sample request limits are asymmetric and must be enforced in the UI and logic:**
   - Raw Leather: buyer may select **up to 3 hides** for a single sample request.
   - Finished Products: buyer may select **only 1 product** per sample request.
   - Verify this cap is enforced both client-side (UI prevents over-selection) and not just visually (check state/array logic, not just disabled buttons).
4. **Bulk orders are the primary objective** — quote request forms should support quantity/bulk fields, not just unit interest.
5. **Custom manufacturing requires user-provided specs** — the form must require either a description of specs or an uploaded file/image before submission; it should not be submittable empty.
6. Every module should funnel toward inquiry submission — check for dead ends (e.g., a product detail page with no visible CTA to request quote/sample).
7. **All forms must capture valid buyer information** for sales follow-up — at minimum name, company, email, country, and message/requirement. Validate that required fields are actually enforced, not just marked with an asterisk.

---

## SCOPE OF AUDIT

Go through the codebase systematically and check the following categories. For each issue found, report it using the format in "Output Format" below.

### 1. Business Rule Violations
- Search for any checkout/cart/payment code paths, even disabled or commented-out ones, that could be reactivated or are confusing leftovers.
- Confirm sample-request selection logic enforces the 3-hides / 1-product asymmetry (check the actual state management — e.g., array length checks, not just UI hints).
- Confirm RFQ/quote forms don't silently calculate or display a "final price" anywhere.
- Confirm custom manufacturing form blocks submission without specs/files.

### 2. Routing & Navigation
- Verify all four routes (`/raw-leather`, `/finished-products`, `/custom-manufacturing`, `/catalog`) resolve correctly and match the intended flows.
- Check for broken links, dead-end pages, 404s, and orphaned routes.
- Confirm the Catalog page actually routes users into the other three modules (not just decorative cards with no `href`/`onClick`).
- Check browser back/forward behavior after form submission (no broken state, no resubmission loops).

### 3. Forms & Lead Capture (highest priority — this is the core conversion mechanism)
For each form (Quote Request, Sample Request, Custom Manufacturing Inquiry):
- Required field validation: does it actually block submission, or just show a red border cosmetically?
- Email field: real format validation, not just `type="email"`.
- Phone/country fields: confirm international formats aren't rejected (this is an *international* buyer platform — a phone validator that only accepts US-style numbers is a bug).
- File upload (Custom Manufacturing): check accepted file types, size limits, error handling on upload failure, and what happens if no file is attached.
- Confirm successful submission gives clear on-screen confirmation (and ideally an email/reference number), not a silent or ambiguous state.
- Confirm failed submission (network error, server error) shows a real error message, not a frozen button or silent failure.
- Check for duplicate-submission bugs (double-click on submit button sends two inquiries).
- Check that form data structure matches what a sales team would actually need to follow up (no missing context fields).

### 4. Product/Material Listings (Raw Leather & Finished Products)
- Confirm filtering/sorting (if present) doesn't break the listing or silently return empty results.
- Confirm "View Details" actually loads correct, matching data for the selected item (check for ID mismatch bugs where clicking item A shows item B's details).
- Confirm images load with proper fallback/alt text if a product has no image.
- Confirm pagination or infinite scroll (if used) doesn't duplicate or drop items.
- Confirm specs/attributes shown are leather-relevant (e.g., hide type, thickness, tanning method, color, grade) and not placeholder/lorem text left in production code.

### 5. State Management & Data Integrity
- Check whether sample/quote selections persist correctly across navigation (e.g., does selecting 2 hides then navigating away and back preserve or correctly reset the selection?).
- Check for stale state bugs — e.g., switching from Raw Leather to Finished Products without clearing previous module's selection limit logic.
- Check that form state isn't lost on accidental refresh in a way that frustrates a buyer mid-inquiry (consider whether this matters for this project's scale).

### 6. Responsive Design & Cross-Device
- Test all four module pages and all three forms at mobile, tablet, and desktop breakpoints.
- Check that international buyers on slower connections aren't blocked by unoptimized images (this is a global B2B audience — flag any unoptimized/uncompressed large images).
- Check touch targets on mobile for quote/sample buttons (not too small/close together).

### 7. Accessibility
- Form labels properly associated with inputs (not just placeholder text used as a label).
- Sufficient color contrast on CTAs ("Request Quote," "Request Sample" buttons).
- Keyboard navigability through multi-step forms (especially Custom Manufacturing if it has an upload step).
- Image alt text on product/material listings.

### 8. Code Quality & Maintainability
- Flag dead code, unused components, console.logs left in production, hardcoded test data, and TODO comments that indicate incomplete features.
- Flag any API keys, credentials, or sensitive config committed in plain text.
- Flag inconsistent naming/structure between the three near-identical inquiry forms (Quote/Sample/Manufacturing) that could cause future maintenance bugs.

### 9. Security Basics (B2B forms are a common spam/abuse target)
- Confirm there's spam/bot protection (captcha, honeypot, or rate limiting) on public forms — flag if missing.
- Confirm file uploads (Custom Manufacturing) validate file type/size server-side, not just client-side.
- Confirm no SQL/NoSQL injection or XSS vectors in form inputs that get rendered back anywhere (e.g., admin dashboards showing submitted inquiries).

---

## OUTPUT FORMAT

For every issue found, report it like this:

```
[SEVERITY: Critical / High / Medium / Low]
Module/File: <file path or component name, with line numbers if possible>
Issue: <what's wrong>
Expected: <what should happen per the business rules above>
Actual: <what currently happens>
Suggested Fix: <concrete fix, with a code snippet if it's small/safe>
```

Group findings by module (Raw Leather, Finished Products, Custom Manufacturing, Catalog, Shared/Forms, Global) and order each group by severity, most critical first.

At the end, give a short summary: total issues found, how many are business-rule violations vs. generic bugs vs. UX polish, and which 3 issues should be fixed first if time is limited.

## INSTRUCTIONS FOR FIXES

- For Critical and High severity issues, propose the fix and apply it directly if you're confident it's safe and self-contained (e.g., a validation check, a broken route, a state bug).
- For Medium/Low severity or anything that touches business logic/design decisions, propose the fix but ask me before applying it.
- Do not introduce a checkout/payment flow, cart, or pricing engine under any circumstance, even if you think it would "improve" the UX — this directly violates the business model.
- Do not remove the 3-hides / 1-product sample asymmetry — that is intentional, not a bug, unless you find it's *not currently implemented*, in which case implement it.
