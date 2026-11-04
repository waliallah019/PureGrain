# Cloudinary image delivery

Vercel hosts the Next.js app. Cloudinary delivers, resizes and compresses images.

```text
Browser → Vercel-hosted page → https://res.cloudinary.com/... → Cloudinary CDN
```

## Why Vercel Image Optimization was removed

The site used up the Hobby plan's monthly Image Optimization allowance, and uncached `/_next/image` requests started failing with `402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`. `next dev` optimizes locally, so this only showed up in production.

## How it works

| File | Purpose |
| --- | --- |
| `lib/image-loader.ts` | Custom `next/image` loader, set in `next.config.mjs`. Replaces `/_next/image`. |
| `lib/cloudinary.ts` | Builds delivery URLs: `cloudinaryUrl()`, `optimizeArticleImages()`, `IMAGE_FALLBACK`. Safe in client code. |
| `lib/cloudinary-local-assets.json` | Maps `/public` paths to Cloudinary assets. |
| `components/ui/safe-image.tsx` | `next/image` with a placeholder for missing or failed database images. |
| `lib/config/cloudinary.ts` | Authenticated SDK for uploads. **Server only.** |

The loader sends each source one of three ways:

1. **Cloudinary URL, or a `/public` path listed in the mapping:** becomes `.../upload/f_auto,q_auto,c_limit,w_<width>/...`. `c_limit` never upscales or crops.
2. **Any other `/public` path:** served as-is from Vercel's static CDN, which has no transformation quota. The file is **not** resized.
3. **Other absolute URLs:** left untouched.

`next.config.mjs` deliberately limits `deviceSizes` and `imageSizes`. Every width is a separate derivative per image and format, and the account is on Cloudinary's Free plan (25 monthly credits). Do not restore Next's defaults or add widths casually.

## Environment variables

| Variable | Exposure | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Public | Optional. Falls back to the cloud name already present in image URLs. |
| `CLOUDINARY_CLOUD_NAME` | Server | Used by the SDK. |
| `CLOUDINARY_API_KEY` | **Server only** | Never prefix with `NEXT_PUBLIC_`. |
| `CLOUDINARY_API_SECRET` | **Server only** | Never prefix with `NEXT_PUBLIC_`, log it, or import `lib/config/cloudinary.ts` from a client component. |

## Adding images

**Product or editorial photography:** upload it to Cloudinary, then use the URL with `next/image`. No transformation is needed in the URL; the loader adds it.

```tsx
<Image src={url} alt="Black calfskin hide" width={1200} height={800} sizes="(min-width: 1024px) 550px, 100vw" className="aspect-[3/2] w-full object-cover" />
```

- Use `SafeImage` instead of `Image` when the value comes from the database.
- Set `width` and `height` to the ratio the image renders at, so space is reserved and nothing shifts.
- Add `priority` only to the main above-the-fold image of a page.
- Prefer `width`/`height` over `fill` for new images. See the note in `components/industry/primitives.tsx` about `fill` under Next 15.3.8. When `fill` is needed, the parent must be `relative` with a defined height or aspect ratio.

**Small interface assets:** keep them in `public/ui`, sized to about 3x their display size.

### Choosing `sizes`

`sizes` tells the browser how wide the image renders, and so which file to fetch. Work it out from the layout. Content sits in `.container-wide`, so cap at the real pixel width rather than a viewport percentage.

| Layout | `sizes` |
| --- | --- |
| Full-bleed hero | `100vw` |
| Two columns from `lg` | `(min-width: 1024px) 550px, 100vw` |
| 4-up cards | `(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw` |
| Fixed thumbnail | `192px` |

### Transformation URLs outside `next/image`

For CSS backgrounds or plain `<img>` tags:

```ts
cloudinaryUrl(src, { width: 160 })                                          // f_auto,q_auto,c_limit,w_160
cloudinaryUrl(src, { width: 300, height: 300, crop: "fill", gravity: "auto" }) // cropped thumbnail
```

Non-Cloudinary sources are returned unchanged, so it is safe on any value. Prefer `crop: "limit"`. Check crop-sensitive images by eye if you use `fill`.

## Verifying

1. Open the site with DevTools → Network → Img and hard-reload.
2. Filter for `_next/image`. There should be no requests.
3. Cloudinary images should come from `res.cloudinary.com`, with `f_auto,q_auto` in the URL and an `image/avif` or `image/webp` response type.
4. Switch to a phone viewport and reload. `w_` values should fall.

`pnpm test` covers URL building (`tests/cloudinary.test.mts`).

## `/public` photographs

The 22 photographs the site references were uploaded to `site-assets/` with `scripts/uploadPublicImages.mjs` and recorded in `lib/cloudinary-local-assets.json`, so `next/image` delivers them through Cloudinary. To add another one, append it to `FILES` in the script and re-run it. Existing assets are not overwritten or duplicated:

```bash
node scripts/uploadPublicImages.mjs --dry   # preview
node scripts/uploadPublicImages.mjs
```

The catalog hero background in `app/catalog/catalog.css` uses a hardcoded Cloudinary URL (`f_auto,q_auto,c_limit,w_1920`), because CSS cannot use the loader. Update it by hand if that image changes.

## Known gaps

| Item | Where | Action |
| --- | --- | --- |
| Unsplash photos and backgrounds | `/products`, `/custom-manufacturing`, `/industries` | Hotlinked, already sized by Unsplash. Not on Cloudinary. Source first-party photos to replace them. |
| Leather Gloves and Sports Goods visuals | `app/products/page.tsx` | The old Unsplash files were deleted upstream and no matching product exists. The frame shows only its caption until a photo is supplied. |
| Admin design preview | `app/admin-ahmza/custom-manufacturing/[id]/page.tsx` | Left at full size on purpose, so staff can inspect customer artwork. |
