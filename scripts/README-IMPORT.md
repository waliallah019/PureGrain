# Raw Leather Bulk Import

Handles **two** scraped sources. The script detects which by looking for
`catalog.json` (leatherwks) or `all_products.json` (District Leather) in the
folder you point it at, and normalises both into one shape before mapping.

```bash
npx tsx scripts/importRawLeather.ts "G:\leatherwks-Data"
npx tsx scripts/importRawLeather.ts "G:\DistrictLeather Data"
```

---

## Source 2 — District Leather Supply (imported 2026-08-06)

| | |
|---|---|
| **Source** | `G:\DistrictLeather Data\all_products.json` |
| **Categories** | Pebble 39, VegTan 29, Suede 25, Smooth 22 = 115 entries |
| **Documents created** | **85** (30 entries are the same product filed under two categories) |
| **Images** | 158 uploaded, 231 in source (the 73 extra belong to the skipped duplicates) |

This scrape is shaped completely differently from leatherwks — there is no
`attributes` object, no `species`, no `colors`, no size field, and the
description is HTML. Everything is recovered by parsing the prose:

| Field | Where it comes from |
|---|---|
| `leatherType` | category (`VegTan` → `Veg Tan`), overridden to `Nubuck`/`Suede` when the product **name** says so |
| `animal` | inferred from name/description keywords; no species field exists |
| `thickness` | `Weight:` in oz → mm (1 oz = 0.396875 mm), preferring an mm figure if the copy already gives one |
| `finish` | `Finish:` label; `"Alligator embossed"` → `Embossed` |
| `size` | derived sq ft (see pricing below) |
| `colors` | always `[]` — the source has no colour data |

### Pricing — read this before trusting the numbers

Source prices are **PKR per piece**, converted at **277.56 PKR = 1 USD** and
divided by the piece's area to reach `pricePerSqFt`.

The catch: **the scrape records a price per variant but never says which
variant.** The same article appears in two price bands — La Perla Azzurra at
both Rs.3,700 and Rs.38,700; Italian Pebble Grain Calf at both Rs.3,200 and
Rs.6,400 — which is a panel-vs-full-hide difference, not colour.

So the area is chosen by price tier:

- **under Rs.6,000** → treated as a cut panel, `DL_PANEL_SQFT` = 2.2 sq ft
- **Rs.6,000 and above** → stated size if the copy gives one, else an
  animal average (cow side 23, calf side 18, lamb 5.5, jumbo skin 20 —
  the figures the descriptions themselves quote)

2.2 sq ft is calibrated from the one listing whose stated size and price agree:
Opera Safari jumbo skin, Rs.33,400 over ~20 sq ft = $6.02/sq ft.

Result: $1.28–$10.70/sq ft, averaging $4.92. Without the tier rule the same data
produced $0.25–$0.64 for 97 products — roughly 10x below market. **These are
still estimates. Set real export pricing during review.** Both constants sit at
the top of the District Leather section of the script if you want to retune them.

Also note `priceValue()` — the naive `replace(/[^0-9.]/g, "")` used for the
leatherwks `$26.95 USD` format turns `Rs.3,700.00` into `0.37`, because the
leading `Rs.` leaves a stray dot that breaks `parseFloat`.

---

# Source 1 — leatherwks

Bulk-imports scraped leatherwks product data into the `RawLeather` collection,
uploading every product photo to Cloudinary along the way.

Script: [`scripts/importRawLeather.ts`](./importRawLeather.ts)

---

## What was imported, and when

| | |
|---|---|
| **Import date** | 2026-08-04 |
| **Source** | `G:\leatherwks-Data` (scraped from leatherwks.com) |
| **Categories** | Embossed (62), Smooth (19), Pebble (12), Suede (4) |
| **Products in catalog** | 97 |
| **Images** | 1069 (1046 `.jpg`, 16 `.png`, 7 `.heic` — Cloudinary auto-converts HEIC to JPG) |
| **Target collection** | `rawleathers` |
| **Cloudinary folder** | `pure-grain-exports/raw-leather/<product-slug>/` |
| **Documents created** | **94**, all `isArchived: true` |
| **Image URLs stored** | **1043** |

### How 97 catalog entries became 94 documents

- `Caviar` and `Basketball` each appear under **two** categories in the source
  catalog. De-duplication is by product `name`, so the second occurrence of each
  is skipped by design. → 95 distinct names.
- `Authentic Western Tool` **already existed** in the collection (created
  2025-12-29, un-archived, 9 images). The import skipped it rather than
  overwriting a live product. → 94 imported.

The remaining 26 source images (1069 − 1043) belong to those three skipped
entries.

### Field mapping

Most fields are derived from the scraped `attributes` block:

| RawLeather field | Source |
|---|---|
| `name` | `scraped.name` |
| `leatherType` | from the scraper **category**, overridden to `Nubuck`/`Suede` when `species` names one — see below |
| `animal` | parsed from `attributes.species` (all 97 → `Cow`) |
| `finish` | category first (`Embossed` → `Embossed`, `Suede` → `Nappa`), otherwise parsed from `attributes.top_finish` |
| `thickness` | `attributes.hide_thickness_weight`, normalised (`1.1/1.3mm (2.5-3.0 oz)` → `1.1-1.3mm`) |
| `size` | `attributes.hide_size` |
| `colors` | `scraped.colors` (empty array when absent) |
| `pricePerSqFt` | `scraped.price` (`$26.95 USD` → `26.95`) |
| `images` | Cloudinary `secure_url`s, **in the original photo order** |
| `description` | `"[REVIEW BEFORE PUBLISHING] "` + `scraped.description` |

#### leatherType must be a registered type

`leatherType` is **not** free text in practice: `RawLeatherForm.tsx` rejects any
value missing from the `rawleathertypes` collection with *"Invalid Leather Type
selected"* — which blocks saving the product at all, including un-archiving it.

The scraped `species` field cannot drive this classification: all 97 products
report `top grain`, so keying off it collapsed every hide into one bucket. The
scraper's **category** is the real surface classification:

| Source | leatherType | Count |
|---|---|---|
| `species` contains "nubuck" | `Nubuck` | 2 |
| `species` contains "suede", or category `Suede` | `Suede` | 4 |
| category `Embossed` | `Embossed` | 60 |
| category `Smooth` | `Smooth` | 18 |
| category `Pebble` | `Pebble` | 10 |

`Smooth` and `Pebble` did not exist in `rawleathertypes` and were added. If you
rename or merge a type in the admin type manager, update the products using it —
otherwise they become unsaveable for the same reason.

Hardcoded on every imported row: `minOrderQuantity: 1`, `sampleAvailable: false`,
`isFeatured: false`, **`isArchived: true`**, `currency: "USD"`, `priceTier: []`,
`priceUnit: "sq ft"`, `discountAvailable: false`, `negotiable: true`.

---

## Running it

The project is a **pnpm** project with an ESM TypeScript config
(`"module": "esnext"`, `"moduleResolution": "bundler"`), so `ts-node` cannot run
it — use `tsx`.

### Dry run (no uploads, no database writes)

```bash
npx tsx scripts/importRawLeather.ts "G:\leatherwks-Data" --dry-run
```

Reads every file, resolves every image path, and prints the full field mapping
for the first three products plus a summary — but touches neither Cloudinary nor
MongoDB. Always do this after changing the mapping logic.

### Real import

```bash
npx tsx scripts/importRawLeather.ts "G:\leatherwks-Data"
```

The path argument is optional and defaults to `G:\leatherwks-Data`.

### Re-running safely

Re-running is safe at any time, including after an interrupted run:

- **Products** are de-duplicated by `name` — anything already in the collection
  is logged as `[SKIP] Duplicate` and left untouched.
- **Images** upload with `overwrite: false`, so an already-uploaded photo is not
  re-uploaded or re-billed; its existing URL is reused.
- **Incomplete products are repaired.** If an existing product holds *fewer*
  images than the source folder has — an interrupted run, or an upload that
  failed — the script re-uploads its photos and updates `images` in place,
  logging `[WARN] Incomplete …` then `[DB] ✓ Repaired`. Without this, a product
  that landed with a partial image set would stay broken forever, because every
  later run would skip it as a duplicate. Products that already have their full
  set are skipped untouched.

To re-import a product you deleted from the admin panel, just re-run — it will be
recreated. To force a fresh copy of a product that still exists, rename or delete
the existing document first.

### Never run two copies at once

The insert is atomic (`updateOne` + `$setOnInsert` + `upsert`), so a second
concurrent run is reported as a duplicate rather than creating a second document.
This matters: during the original import, three overlapping runs produced 72
duplicate documents before the guard existed. They were removed, and the atomic
upsert now prevents a recurrence.

Note that a `name` unique index is **not** viable here — the collection already
contains legitimately repeated names from before this import (e.g. two
`Black Leather` rows), so the index would fail to build.

If you ever suspect duplicates:

```bash
mongosh "$MONGO_URI" --eval 'db.rawleathers.aggregate([{$match:{description:/^\[REVIEW BEFORE PUBLISHING\]/}},{$group:{_id:"$name",n:{$sum:1}}},{$match:{n:{$gt:1}}}]).toArray()'
```

### Upload reliability

Cloudinary sporadically returns request timeouts when several uploads are in
flight at once. Each upload therefore gets **4 attempts with exponential backoff**
(1s, 2s, 4s), logged as `[IMAGE] ↻ Retry`. Uploads run **6 at a time** per
product: they are latency-bound rather than bandwidth-bound, so this cut the full
run from roughly 3.6 hours to under 30 minutes with no extra bandwidth cost.

If you ever see `[object Object]` in an error, the Cloudinary SDK rejected with a
bare `{ error: { message, http_code } }` object — `errText()` in the script
unwraps that, so real messages come through.

---

## `isArchived = true` — what it means

Every imported product is written with **`isArchived: true`**. This is
deliberate and applies without exception.

Archived products are **hidden from the live site**. `rawLeatherService.getRawLeather()`
defaults to `isArchived: { $ne: true }` whenever a caller does not pass an
explicit filter, so public product listings exclude them automatically.

Nothing from this import reaches customers until a human reviews it.

### Reviewing and publishing

1. Go to the admin panel → **`/admin-ahmza/raw-leather`**.
2. Open the filter panel and set **Archived** to show archived rows (leave it on
   "all" to see everything). You can also sort by the **Archived** column.
3. Imported rows are easy to spot — their description begins with
   `[REVIEW BEFORE PUBLISHING]`.
4. Edit the product and check these before publishing:
   - **Description** — remove the `[REVIEW BEFORE PUBLISHING] ` prefix. The body
     is the supplier's original copy and still repeats the spec sheet inline.
   - **`pricePerSqFt`** — imported from the source site as a *reference* price.
     Set your own export pricing.
   - **`priceTier`** — imported empty. Add volume breaks if you use them.
   - **`minOrderQuantity`** — imported as `1`. Set your real MOQ.
   - **`finish` / `leatherType`** — auto-derived from supplier text; spot-check.
   - **Images** — confirm order and that no stray photos slipped in.
5. Uncheck the **Archived** checkbox on the edit form and save. The product is
   now live.

---

## Notes and known quirks

- **Cloudinary folder slugs** come from the on-disk scraper folder, not the
  product URL. 21 of the scraped URLs are stale Shopify duplicates — the product
  "BS Safari Thunder" has the URL slug `bs-safari-moonface-copy`, and "Authentic
  Deep Croco" has `copy-of-authentic-barcelona`. The folder name always matches
  the real product, so it is used instead.

- **Image deletion from the admin panel will not remove these images from
  Cloudinary.** `rawLeatherService` derives the public ID by slicing the URL at
  the first `raw-leather` segment, producing `raw-leather/<slug>/<file>` — but
  the actual public ID is `pure-grain-exports/raw-leather/<slug>/<file>`. The
  `destroy()` call fails silently and the asset is orphaned in Cloudinary. This
  is pre-existing behaviour in `lib/services/rawLeatherService.ts`, not something
  the import script introduced; it affects any product stored under a nested
  folder. Clean up orphans in the Cloudinary console if it matters, or fix the
  parsing in the service.

- **Upload pacing** — a 120 ms delay sits between uploads to stay clear of
  Cloudinary rate limits. A full 1069-image run takes roughly 20–30 minutes.

- **`MONGO_URI`, not `MONGODB_URI`** — the script reads `.env.local` from the
  project root and uses the same variable name as `lib/config/db.ts`.

- The script reuses the codebase's own modules (`lib/config/db.ts`,
  `lib/config/cloudinary.ts`, `lib/models/RawLeather.ts`) rather than
  reimplementing connection or upload logic. They are imported dynamically so
  `dotenv` populates `process.env` before those modules read it at import time.
