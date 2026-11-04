/**
 * Uploads the /public photographs the site uses to Cloudinary and records them
 * in lib/cloudinary-local-assets.json. After that, every <Image> showing one of
 * these paths is delivered and resized by Cloudinary with no call-site changes.
 *
 *   node scripts/uploadPublicImages.mjs          # upload and write the mapping
 *   node scripts/uploadPublicImages.mjs --dry    # report only, change nothing
 *
 * Safe to re-run: `overwrite: false` returns the existing asset instead of
 * creating a duplicate. Commit the updated JSON and deploy to take effect.
 */

import dotenv from "dotenv"
import fs from "node:fs"
import path from "node:path"
import { v2 as cloudinary } from "cloudinary"

dotenv.config({ path: ".env.local" })

const DRY_RUN = process.argv.includes("--dry")
const MAPPING_FILE = "lib/cloudinary-local-assets.json"
const FOLDER = "site-assets"

// Photographs referenced by live pages or blog covers. Interface assets
// (public/ui, favicon, placeholders) stay local on purpose.
const FILES = [
  "/collection.png",
  "/custom-leather-manufacturing-process.jpg",
  "/hero-leather-espresso.jpg",
  "/hero-leather-tan.jpg",
  "/hero-leather-warm.jpg",
  "/leather-accessories-collection-display.jpg",
  "/leather-artisan-crafting-premium-leather-in-worksh.jpg",
  "/leather-automotive.jpg",
  "/leather-fullgrain.jpg",
  "/leather-nubuck.jpg",
  "/leather-topgrain.jpg",
  "/leather-upholstery.jpg",
  "/local/cutting-detail.jpg",
  "/local/cutting-leather.jpg",
  "/local/finishing-goods.jpg",
  "/local/hide-inspection.jpg",
  "/local/hide-preparation.jpg",
  "/local/sialkot-city.jpg",
  "/luxury-leather-craftsmanship-workshop-artisan.jpg",
  "/luxury-leather-wallet-finished-product.jpg",
  "/minimalist-leather-texture-close-up.jpg",
  "/premium-raw-leather-hide-texture.jpg",
]

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf8"))

for (const file of FILES) {
  const diskPath = path.join("public", file)
  if (!fs.existsSync(diskPath)) throw new Error(`Missing file: ${diskPath}`)

  const publicId = `${FOLDER}/${file.slice(1).replace(/\.[^.]+$/, "")}`
  if (DRY_RUN) {
    console.log(`${file} -> ${publicId}`)
    continue
  }

  const asset = await cloudinary.uploader.upload(diskPath, {
    public_id: publicId,
    overwrite: false,
    resource_type: "image",
  })
  mapping[file] = `v${asset.version}/${asset.public_id}.${asset.format}`
  console.log(`${file} -> ${mapping[file]}`)
}

if (!DRY_RUN) {
  fs.writeFileSync(MAPPING_FILE, `${JSON.stringify(mapping, null, 2)}\n`)
  console.log(`Wrote ${MAPPING_FILE}. Commit it and deploy.`)
}
