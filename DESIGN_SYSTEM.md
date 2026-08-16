# Premium B2B Leather Marketplace Design System

## Overview
Complete UI redesign for a high-end B2B leather trading platform with premium aesthetics, rich information density, and enterprise-ready features.

## Key Components Created

### 1. Announcement Ticker (`components/layout/announcement-ticker.tsx`)
- Horizontal scrolling announcement banner
- Auto-rotating announcements every 5 seconds
- Pause on hover for better UX
- Badge system for different announcement types (Discount, MOQ, Export, Promo, Info)
- Progress indicator and navigation dots
- Premium styling with leather-inspired colors

### 2. Enhanced Form Components
- **EnhancedFormField** (`components/forms/enhanced-form-field.tsx`)
  - Contextual helper text
  - Tooltips for additional information
  - Icons and badges
  - Success/error states with visual indicators
  - Stats display for B2B metrics
  - Micro-interactions

- **FormSection** (`components/forms/form-section.tsx`)
  - Card-based form sections
  - Icon support
  - Stats display
  - Highlight states
  - Hover effects

### 3. Enhanced Global Styles (`app/globals.css`)
- Premium B2B design tokens
- Leather-inspired color palette
- Textured backgrounds
- Premium shadows
- Smooth transitions and micro-interactions
- Form field enhancements

## Design Principles

### Information Density
- Forms use card-based sections instead of plain fields
- Contextual helper text and tooltips
- Stats and metrics displayed inline
- Visual hierarchy with icons and badges

### B2B Features Highlighted
- MOQ indicators
- Bulk discount information
- Quality certifications
- Shipping information
- Export/import notices

### Premium Aesthetics
- Leather-inspired color palette (browns, tans, ambers)
- Rich textures and shadows
- Professional typography
- Smooth animations and transitions

### Micro-interactions
- Hover states on all interactive elements
- Focus states with premium styling
- Loading states
- Success/error feedback

## Implementation Guide

### Applying to Forms

1. **Replace plain form fields with EnhancedFormField**
```tsx
<EnhancedFormField
  id="companyName"
  label="Company Name"
  required
  icon={<Building2 />}
  helperText="Your registered business name"
  tooltip="This will be used for invoicing and shipping"
  badge="B2B"
  error={errors.companyName}
>
  <EnhancedInput
    id="companyName"
    value={formData.companyName}
    onChange={handleChange}
    error={errors.companyName}
  />
</EnhancedFormField>
```

2. **Wrap form sections with FormSection**
```tsx
<FormSection
  title="Company Information"
  icon={Building2}
  description="Tell us about your business"
  badge="Required"
  stats={[
    { label: "MOQ", value: "50 sq ft", icon: Package },
    { label: "Discount", value: "10%", icon: DollarSign }
  ]}
>
  {/* Form fields */}
</FormSection>
```

3. **Add B2B context cards**
```tsx
<Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
  <CardContent className="p-4">
    <div className="flex items-center gap-2">
      <Badge>MOQ</Badge>
      <span className="text-sm">Minimum order: 50 sq ft</span>
    </div>
  </CardContent>
</Card>
```

## Next Steps

1. Apply enhanced form components to:
   - Sample Request Form
   - Quote Request Form
   - Custom Manufacturing Form
   - Contact Form

2. Enhance product cards with:
   - MOQ indicators
   - Bulk pricing tiers
   - Quality grades
   - Certification badges
   - Stock levels

3. Add contextual information panels:
   - Shipping calculator
   - Bulk discount calculator
   - Quality comparison tables
   - Certification displays

4. Implement micro-interactions:
   - Form field focus animations
   - Button hover states
   - Card hover effects
   - Loading skeletons

## Color Palette

> Corrected 2026-08-16. This section previously listed `#5c4033 / #d4a574 /
> #8b6f47 / #3d2817` and named Playfair Display + Inter — **none of which the
> app actually used**. Those stale values were being copied into new components
> and are the main reason the palette drifted. Always read the tokens from
> `app/globals.css`; never hardcode a hex in a component.

Single source of truth: the CSS custom properties in `app/globals.css`, surfaced
as Tailwind colours in `tailwind.config.ts`. Every token has a light and a dark
value, so use the Tailwind class (`bg-leather`) and never the raw hex.

| Token | Tailwind | Light | Role |
|---|---|---|---|
| `--background` | `bg-background` | `#FAF6F0` cream | Page ground |
| `--foreground` | `text-foreground` | `#1A0F09` | Body ink |
| `--primary` | `bg-primary` | `#2C1810` espresso | Dark sections, primary button. **Flips to gold in dark mode** |
| `--leather` | `bg-leather` | `#3D2314` | Dark brown in *both* themes — use for surfaces that must stay dark (hero, global-reach) |
| `--brass` | `bg-brass` | `#C9943A` | Fills, borders, and text **on dark surfaces** |
| `--brass-ink` | `text-brass-ink` | `#8E6420` | Text-safe brass **on light surfaces** (see contrast note) |
| `--tan` | `text-tan` | `#D4B896` | Dark-mode counterpart to `leather` for headings |
| `--bone` | `bg-bone` | `#F0E8DC` | Alternating section ground |
| `--accent` | `bg-accent` | `#A0724A` | Secondary warm accent, gradients |
| `--shadow-color` | — | `20 45% 18%` | Warm tint for all elevations |

### The brass contrast rule

`--brass` at 51% lightness scores only **~2.5:1** on the cream background, which
fails WCAG AA for text. It is fine as a fill, a border, or as text on espresso.

- **Light surface → `text-brass-ink`** (clears 4.5:1)
- **Dark surface → `text-brass`**

`--brass-ink` inverts per theme (deep antique brass on light, bright brass on
dark), so `text-brass-ink` is correct in both themes *as long as the element sits
on the page background*. Sections that stay dark in both themes (hero,
global-reach) must use `text-brass`.

Use the `.text-eyebrow` / `.text-eyebrow-on-dark` component classes for section
eyebrows rather than re-spelling `text-label text-brass`.

## Typography

Two families, both self-hosted via `next/font` in `app/layout.tsx` and exposed as
`--font-sans` / `--font-serif`, which `tailwind.config.ts` maps onto
`fontFamily.sans` and `fontFamily.serif`.

- **Headings / display**: Cormorant Garamond (`font-serif`, `.heading-*`)
- **Body / UI**: Jost (`font-sans`)
- **Weights**: 300–700

> Do not add a Google Fonts `@import` to `globals.css`. The fonts are already
> self-hosted; an import downloads them a second time and blocks render.

## Spacing System

- **Tight**: 0.5rem (8px)
- **Base**: 1rem (16px)
- **Loose**: 1.5rem (24px)
- **XL**: 2rem (32px)
- **XXL**: 3rem (48px)

---

# 2026-08-16 — Foundation repair + landing page revamp

## Part 1: Foundation fixes (site-wide)

### Typography pipeline was broken

`next/font` loaded Jost and Cormorant into `--font-inter` / `--font-playfair`,
but `tailwind.config.ts` declared no `fontFamily`, so:

- `<body class="font-sans">` (specificity 0,1,0) beat the base-layer
  `body { font-family: 'Jost' }` (0,0,1) — **all body copy rendered in
  `system-ui`**, not Jost.
- `font-serif` resolved to Tailwind's default `ui-serif, Georgia` — so the ~30
  `font-serif` usages (footer wordmark, card titles, stat numbers, step numbers)
  rendered in **Georgia** while `<h1>`/`<h2>` rendered Cormorant. Two serifs on
  every page.
- `globals.css` *also* `@import`ed both families from the Google CDN, so each
  face downloaded twice.

Fixed by renaming the variables to `--font-sans` / `--font-serif`, adding
`fontFamily.sans`/`.serif` to the Tailwind config, deleting the CDN import, and
replacing the hardcoded `font-family` declarations with `@apply font-sans` /
`font-serif`. Verified in-browser: `body`, `h1`, `h2` and `.font-serif` now all
resolve to the intended faces.

### Colour fixes

- **Added `--brass-ink`** and swept every light-surface `text-brass` across
  `app/**` and `components/**` to it (footer, header marquee and the sample-tray
  bar keep raw `brass` — they are dark surfaces).
- **Aligned stray hexes to tokens.** `.text-leather-brown` was `#5c4033` while
  `--leather` is `#3D2314`; `.text-leather-tan` was `#d4a574` vs `--tan`
  `#D4B896`. `.gradient-leather`, `.shadow-leather*`, `.hover-lift`,
  `.form-field-enhanced` and `.focus-premium` all hardcoded off-palette values.
  All now reference tokens.
- **Added `--shadow-color`** (warm brown) so elevations stop reading grey on cream.
- **`shadow-card` / `shadow-card-hover` never existed.** `.card-industrial`
  applied them, and Tailwind silently resolved them as shadow *colour* utilities
  off the `card` palette entry — the cards had no elevation at all. Real
  `boxShadow` tokens added; the commented-out `.card-industrial:hover` restored.
- **`.btn-*` pinned to `rounded-none`.** shadcn's `<Button>` base adds
  `rounded-md`, so `<Button className="btn-brass">` rendered rounded while
  `<Link className="btn-brass">` rendered square — the same button in two shapes
  on the same page.
- **`CurrencySwitcher`** hardcoded `#2c1810 / #c49a6c / #f5ecd9` with a duplicate
  `.dark` block, and referenced the now-dead `--font-inter`. Rewritten on tokens,
  plus an `onDark` variant for the transparent header.
- **`page-banner.tsx`** (quote-request) used Tailwind `amber-*` throughout;
  remapped to brass/leather/bone tokens.

### Header over the hero

The homepage header is transparent over dark photography, but the logo swapped on
*theme* only — so in light mode the dark-ink logo sat on the dark hero and
vanished. Logo choice now follows the **surface** (`isTopOverlayPage`), and the
inactive nav tone moved from `hsl(30 10% 60%)` (~3:1) to
`leather-foreground/80`.

### Floating samples sticker

Was `fixed top-28`, permanently overlapping the top-right of the content column
and covering section headings at tablet widths. Moved to bottom-right, stacked
above the WhatsApp button, glow retinted from red/amber to brass.

### Accessibility

Global `prefers-reduced-motion` block added to `globals.css` (neutralises the CSS
keyframe utilities and smooth scroll); Framer Motion work is guarded per-component
with `useReducedMotion`.

## Part 2: Landing page revamp (`app/page.tsx`)

Rewritten around two new modules:

- **`components/landing/primitives.tsx`** — `Reveal`, `Stagger`/`StaggerItem`,
  `CountUp`, `SectionHeading`, `useParallaxY`, plus the shared `EASE`
  (`[0.22, 1, 0.36, 1]`) and `VIEWPORT` constants. Previously every section
  hand-rolled its own `initial`/`whileInView`/`transition` triple with drifting
  durations, which is why the page read as stacked templates. All of it degrades
  to a plain render under reduced-motion.
- **`components/landing/HeroSlider.tsx`** — extracted from the page body.

### Section changes

| Section | What changed |
|---|---|
| Hero | Left-aligned (the scrim was already a left→right gradient but the copy was centred, so they fought). Ken Burns on the active frame, scrim rebuilt from `leather` instead of the cold `hsl(30 10% 12%)`, standing proof row, segmented autoplay progress, pause/prev/next, autoplay pauses on hover + focus-within, swipe retained |
| Trust strip | Numbers now **count up** on first view via `CountUp`; each stat gained a one-line qualifier. `ISO 9001` renders statically — animating a certification number would read as decoration |
| **Two ways to work with us** | **New.** Path-selection split (Leather Hides / Finished Products) mirroring the real catalogue and nav split, so a first-time B2B visitor can self-select |
| Leather Categories | Replaced a hand-built infinite carousel (3× cloned array + 6 coordinating effects) with a **scroll-snap rail** — native momentum/touch on mobile, arrows just call `scrollBy`. Cards now show a live material count. **Fixed a real bug**: the hover overlay was `bg-transparent`, so "View Collection" appeared directly on the photo and was frequently unreadable; there is now a permanent bottom scrim |
| Why PureGrain | Icons moved into bordered tiles; film-grain texture over the espresso ground |
| Featured Materials | Both rows now share one `MaterialCard`, so hides and finished goods stop looking like different sites. Empty states added |
| Industries | Cards became links to `/industries` with lift-on-hover |
| Process | Connecting rail **draws itself as you scroll** (`useScroll` + `useSpring`) — horizontal on desktop, vertical on mobile |
| Global Reach | Concentric rings counter-rotate with a brass node each; disabled under reduced-motion |
| Testimonials | Semantic `<figure>`/`<blockquote>`/`<figcaption>` |
| Closing CTA | Repointed at the real conversion action (Request Free Samples) with a reassurance line |

### Content integrity

Every claim on the page (25+ years, 40+ countries, ISO 9001, 500K+ sq ft monthly,
free samples) already existed elsewhere on the site. **No new certifications or
credentials were invented** — the revamp surfaces existing claims rather than
adding any.

### Verified

- No horizontal overflow at **375 / 768 / 1024 / 1440**
- Dark mode checked across all sections
- `tsc --noEmit` clean project-wide
- Fonts confirmed in-browser (`body`→Jost, `h1`/`h2`/`.font-serif`→Cormorant)

## Follow-up fixes

### Hero copy was centred in dead space

The hero `<section>` is `flex items-center`, which made its `.container-wide`
child a **flex item** — so it shrank to fit its content (768px) instead of
filling the section, and `mx-auto` then centred that shrunken box. At 1920px the
copy sat 624px from the left with 624px of empty image to its right, out of
alignment with both the header logo and the slide controls directly beneath it.

Fixed with `w-full` on the copy container, so `max-w-[1240px] mx-auto` behaves
normally and the copy lands on the same gutter as every other section. The
headline column was also widened (`max-w-3xl lg:max-w-4xl`) to spread across the
frame; the description stays at `max-w-2xl` to keep the measure readable.

Measured after the fix — headline left edge exactly matches the container gutter
at every breakpoint: 1920→388, 1440→148, 1024→48, 768→24, 375→24.

### Floating action stack (Free Samples + WhatsApp)

`WhatsAppButton` is built around a documented contract:

```
bottomOffset = stickerBottom + stickerHeight + 16px gap
```

That contract had been broken — the sticker was moved to `top-28` (where it
covered section headings on tablet) and `layout.tsx` passed `bottomOffset={24}`
to compensate, putting WhatsApp alone in the corner. Restored to the intended
arrangement: **sticker in the bottom-right corner, WhatsApp stacked directly
above it.**

Current dimensions — these three files must stay in sync:

| | sticker bottom | sticker size | WhatsApp offset |
|---|---|---|---|
| mobile (<768px) | 16px | 72px | 104 |
| desktop (≥768px) | 24px | 92px | 132 |

`WhatsAppButton` previously derived its mobile offset as
`Math.min(bottomOffset, 116)`, silently clamping any caller value to a hardcoded
number that no longer matched the sticker. That is now an explicit
`mobileBottomOffset` prop. Verified in-browser: exactly 16px gap and flush right
edges at both 1440 and 375, no overlap.

### Verified (follow-up pass)

- No horizontal overflow at **320 / 414 / 640 / 834 / 1280 / 1920**
- Hero CTA height 52–54px at every width (clears the 44px touch-target minimum)
- All 21 internal CTA targets return HTTP 200
- Hero primary/secondary, supply-path cards and the sticker click through to the
  correct routes
- `tsc --noEmit` clean

---

# 2026-08-16 (later) — About + Contact revamp

## Single source of truth for company facts: `lib/site.ts`

Company details were re-typed in the footer, the contact page and the About page
HTML, and had drifted into **live, customer-facing errors**:

| Field | Contact page displayed | Contact page *linked to* | Footer |
|---|---|---|---|
| Email | `info@puregrain.com` | `info@puregrain.com` | `info@puregrainexports.com` |
| Sales email | `sales@puregrain.com` | `trade@puregrain.com` | — |
| Phone | `+92 308 4578957` | `tel:+921234567890` | `+92 324 5243670` |
| Intl. phone | `+1 (202) 555-0123` (reserved fictional number) | — | — |
| Hours | "9:00 AM – 6:00 PM **IST**" — Indian Standard Time | — | — |

So the phone link **dialled a placeholder**, the sales email label and target
disagreed, and a Pakistani exporter published Indian timezone hours.

Everything now imports from `lib/site.ts` (footer and contact page both
converted). Per the owner's instruction the footer's values are canonical.
Hours are labelled **PKT (UTC+5)**.

## About page: raw HTML → React

`app/about/page.tsx` read an 832-line `policy-body.html` off disk with
`fs.readFileSync` and injected it via `dangerouslySetInnerHTML`, styled by the
*return-policy* stylesheet plus a local `overrides.css`. It also pulled Cormorant
Garamond, Jost **and** Font Awesome from CDNs in `<head>` — re-downloading the
two brand faces `app/layout.tsx` already self-hosts.

Content now lives in `app/about/AboutContent.tsx` as real components on the same
primitives as the landing page (14 sections: hero, at-a-glance, buyer friction,
5-chapter story, tannery criteria, values, founder, product scope, process with
the scroll-drawn rail, compliance, audiences, export regions, FAQ, CTA).

Now unreferenced (left in place, safe to delete): `app/about/policy-body.html`,
`PolicyContent.tsx`, `PageEffects.tsx`, `overrides.css`.

## Location narrative corrected

The About page said "Headquartered in Sialkot" throughout while the footer and
contact page said Lahore. Per the owner: **head office in Lahore; sourcing from
Sialkot, Kasur and Karachi.** That split now lives in `SITE.sourcingRegions` and
is stated on both pages — it is also a stronger trust signal than a single-city
claim.

## Imagery — `/public/local/`

Eight photographs sourced via the **Openverse API** (Creative Commons), filtered
to licences permitting commercial use, downloaded locally. Attribution is
mandatory for the CC BY / BY-SA entries and lives in `public/local/CREDITS.md` —
keep that file with the images.

**Honest limitation:** there are no freely-licensed photographs of *Pakistani*
tanneries in the CC repositories. Searches for "Kasur tannery", "Sialkot leather"
and "Pakistan leather" return landmarks, not industry. What is used instead:

- Genuine leather-production and workshop photography (tanning drums, cutting,
  finishing) — **not** captioned or alt-texted as Pure Grain's own premises
- Genuine Lahore and Sialkot photography for location context

Unsplash and Pexels both block scripted access; Wikimedia's API is unreachable
from this environment and its thumbnailer returns 400 for very large files, so
Openverse is the working route if more images are needed later.

Replace these with real facility photography when available — the alt text and
captions are written so that swapping the files requires no copy changes.

## Also fixed

- Both new heroes needed a **vertical** scrim on top of the horizontal one; the
  fixed header washed out against bright sky in the upper right of the
  photographs.
- Story chapters moved to 3:2 images with tighter rhythm — at 4:3 with
  `space-y-24` the five chapters alone pushed the page past 13,000px.

## Verified

- No horizontal overflow at **375 / 768 / 1024 / 1440 / 1920** on both pages
- Dark mode checked on both; embedded map resolves to the real Daroghawala address
- All 17 internal links return HTTP 200; `mailto:`, `tel:` and the WhatsApp
  number are now mutually consistent
- `tsc --noEmit` clean

## ⚠ Unresolved: the two pages claim different numbers

The landing page trust strip says **25+ years** and **40+ countries**. The About
page hero says **10+ years** and **30+ countries**. Both cannot be true, and
they sit two clicks apart on the same site.

Neither was changed — picking one would mean publishing a figure nobody has
verified. **The business needs to decide which is correct**, then update
`TRUST_STATS` in `app/page.tsx` and `HERO_STATS` in `app/about/AboutContent.tsx`.

---

# 2026-08-16 (later still) — shared PolicyHero + About tannery hero

## `components/layout/policy-hero.tsx`

The Return Policy hero (dark leather texture, brass-framed centred block, gold
"last updated" pill, trust chips with brass dividers) only existed as
`.hero.leather-texture` inside `app/return-policy/policy.css` — a stylesheet
scoped under `.policyPage` and loaded from hand-written HTML, so no React page
could reuse it.

It is now a token-based component and is used on **Contact**, **Privacy** and
**Terms**. Return Policy keeps its original CSS version (unchanged).

- Contact's photographic hero was removed in favour of it, with the email/phone
  CTAs moved into a band directly beneath.
- Terms: the legacy `#terms-hero-section` block was deleted from
  `app/terms/policy-body.html` and `<PolicyHero>` renders **outside**
  `<main className="policyPage">`, so `policy.css` cannot restyle it.
- Side hairlines are hidden below `sm` and trust chips stack without dividers on
  mobile, so the frame never crowds the text.

## Header surface routing (real bug fixed)

The header decided its appearance from three hardcoded pathname comparisons
(`isPaymentsTradeTermsPage`, `isReturnPolicyPage`, `isTermsPage`). Any page that
gained a dark hero without being added to those checks rendered **dark nav links
and the dark-ink logo on a dark hero** — which is what happened to Contact and
Privacy the moment they got the PolicyHero, and was already happening on About.

Replaced with two intent-named lists at the top of `header.tsx`:

- `OVERLAY_HERO_ROUTES` (`/`, `/about`) — full-bleed photo under a transparent
  header; bar paints nothing, switches to light ink + light-ink logo.
- `SOLID_HEADER_ROUTES` (`/contact`, `/privacy`, `/terms`, `/return-policy`,
  `/payments-and-trade-terms`) — dark hero *band* below the header; bar keeps an
  opaque white (light) / leather-brown (dark) surface.

Add new pages to the appropriate list rather than adding another `pathname ===`
branch.

## About hero: tannery photograph

Now `/local/hide-preparation.jpg` — a real working tannery (stacked hides,
tanning drums).

**Both tannery images shipped with a "CORA + SPINK, Worcestershire England"
watermark burned into the top-right corner.** Publishing another leather brand's
mark on this site would be wrong, so both were cropped to 84.5% width
(1280→1082px) with `sharp`. Their CC BY-SA 4.0 licence permits modification with
attribution, which `public/local/CREDITS.md` retains.

`sharp` was added as a devDependency for the crop. It is also what Next.js uses
for production image optimisation, so it is worth keeping.

**Still true: no Pakistani tannery photograph exists under a free licence.**
Re-checked with `tannery Pakistan`, `Punjab tannery`, `leather factory Pakistan`,
`Pakistan tannery worker` (all zero results) and `Kasur` (mosques and electoral
maps only). The hero is a genuine South Asian tannery, is alt-texted as "a
working tannery" with no country claim, and should be swapped for real
Kasur/Sialkot plant photography when available — no copy changes needed.

## Verified

- No horizontal overflow across **5 pages × 5 widths** (375/768/1024/1440/1920)
- Header contrast confirmed by computed style on all four pages: solid white bar
  + dark ink on Contact/Privacy/Terms, transparent bar + light ink + light logo
  on About
- Dark mode checked; mobile (375) hero frame verified
- `tsc --noEmit` clean

---

# 2026-08-16 (final) — Quality & Process revamp

## Same legacy stack as the old About page

`app/quality/page.tsx` read a 480-line `policy-body.html` off disk via
`fs.readFileSync` + `dangerouslySetInnerHTML`, styled by the return-policy
stylesheet **plus 895 lines of local `overrides.css`**, and pulled Cormorant
Garamond, Jost and Font Awesome from CDNs in `<head>`.

That stack is precisely why the page drifted: its own colour variables never
mapped to the theme tokens, so section grounds, card surfaces and dark mode all
diverged. Concretely, before the rewrite the page had:

- Decorative Font Awesome glyphs sitting inline before `<h2>`s (🪶 before "Where
  Grain Meets Greatness", another before "How We Ensure Quality") — against the
  site's SVG-icon-in-bordered-tile convention
- Rounded white cards on a `parchment-texture` beige that is not `bg-bone`
- One card in each row arbitrarily emphasised with a gold border
- Everything centre-aligned, versus the site's editorial left-aligned rhythm
- In dark mode the whole page flattened to a single brown wash with no section
  rhythm, because the textures are fixed colours rather than tokens

Content now lives in `app/quality/QualityContent.tsx` on the shared primitives —
nine sections, all original copy preserved: hero, at-a-glance, the tagline
essay, certifications, quality pillars, the six-stage process, finishing
mastery, FAQ, CTA.

Now unreferenced (left in place, safe to delete alongside the About equivalents):
`app/quality/policy-body.html`, `PolicyContent.tsx`, `PageEffects.tsx`,
`overrides.css`.

## Two images pulled for brand-integrity reasons

**`/custom-leather-manufacturing-process.jpg` (removed from Stage 02).** An
AI-generated collage whose captions read "CUSTOM MANFACTUIING PROCESS", "Surang
quality voriont", "Cutt and shapeje rting acodig to ahiign", "Assemble tookther".
Garbled machine text on a page titled *Quality Without Compromise* actively
undercuts the argument the page is making. Replaced with a real tannery
photograph. The file is still in `/public` but is no longer referenced anywhere.

**`/public/local/workshop-bench.jpg` (deleted).** A large illuminated
**"Portland LEATHER GOODS"** sign dominates the frame — a US competitor's
branded workshop. It was live on both the Quality page (Certified Excellence)
and the About page (Chapter 01). Both now use brand-free craft photography from
`/public`. Recorded in `public/local/CREDITS.md`.

This is the third brand-integrity issue found in the sourced imagery, after the
CORA + SPINK watermarks. **Check new photography for third-party signage,
watermarks and generated text before shipping it.**

## Header routing

`/quality` added to `OVERLAY_HERO_ROUTES` — it now has a full-bleed photographic
hero, so the header goes transparent with light ink and the light-ink logo.

## Verified

- No horizontal overflow at **375 / 768 / 1024 / 1440 / 1920**
- Dark mode checked; the six-stage rail, cards and FAQ all hold up
- The `#process` hero CTA scrolls to the section with 96px clearance under the
  fixed header (`scroll-mt-24`)
- All 14 internal links return HTTP 200; no broken images once in viewport
- `tsc --noEmit` clean

---

# 2026-08-16 (final) — Quality hero unified + floating actions split

## Quality now uses the shared PolicyHero

Its bespoke full-bleed photographic hero was replaced with `<PolicyHero>`, so
**Return Policy, Contact, Privacy, Terms and Quality now open identically**.

`PolicyHero` gained one optional prop, `actions` — a CTA row rendered between the
subtitle and the trust chips. The legal pages pass nothing and are unchanged.
Quality's three QC facts (100% batch inspected / 4 global certifications /
6-step QC process) ride in the existing trust-chip row rather than as a separate
stats band, which is what keeps the hero the same height and rhythm as the other
four.

`/quality` moved from `OVERLAY_HERO_ROUTES` to `SOLID_HEADER_ROUTES` to match —
its hero is now a band below the header rather than a full-bleed photo, so the
bar needs its own opaque surface again.

## Floating actions split across the two corners

Previously both sat in the bottom-right, stacked. Now:

- **Free Samples sticker → bottom-LEFT**
- **WhatsApp → bottom-RIGHT** (unchanged corner)

Each is a single unambiguous target instead of a crowded pair. Because they no
longer share a corner, `WhatsAppButton`'s offsets went back to plain corner
values (24 / 16) from the 132 / 104 that existed purely to clear the sticker —
its prop docs were updated to say so.

### Sticker sizing

Steps with the breakpoint so it stays proportionate to the 44/52px WhatsApp FAB
rather than dominating the viewport:

| Breakpoint | Size | % of a 375px viewport |
|---|---|---|
| `<640px` | 64px | 17% |
| `640–1023px` | 76px | — |
| `≥1024px` | 88px | 5% at 1920 |

Measured at 375/414/768/1024/1440/1920: no overlap with WhatsApp at any width,
and both share the same bottom baseline (16px mobile / 24px from `sm`).

### Sample-tray clearance

The sticker previously had none — the full-width sample-tray bar would have
covered it in its new bottom-left home. It now lifts above the bar using the
same `useSampleTrayVisible()` hook WhatsAppButton uses.

Applied as an **inline style**, not an arbitrary Tailwind class: the value is
`calc(64px + env(safe-area-inset-bottom, 0px) + 16px)`, and a `calc()` containing
`env(...)` — hence a comma — is fragile through Tailwind's arbitrary-value
parser. Inline also beats the `bottom-4 sm:bottom-6` utilities without needing
`!important`. Verified with a real tray item added through the UI: at both 1440
and 375 the sticker and the WhatsApp button both clear the bar.

## Verified

- No horizontal overflow across **6 pages × 5 widths** (375/768/1024/1440/1920)
- Dark mode: header goes leather-brown with the light-ink logo, hero holds
- `#process` CTA still scrolls with 96px clearance under the fixed header
- `tsc --noEmit` clean

## Known remaining inconsistencies (not addressed)

- `components/raw-leather-details/RawLeatherCard.tsx` and
  `components/product-details/ProductCard.tsx` use Tailwind `amber/green/blue`
  palettes and hardcode `$` prices (bypassing `PriceDisplay`). **Both are dead
  code** — never rendered anywhere; the catalog pages have their own inline
  cards, which are already on-brand. Delete or rewrite before reusing.
- The `app/admin-ahmza/**` area still uses raw Tailwind palettes throughout.
  Internal tooling, deliberately left alone.
- `.site-leather-texture` intentionally hardcodes `#2C1810` so it looks identical
  in both themes.

