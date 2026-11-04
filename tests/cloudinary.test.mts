import test, { describe } from "node:test"
import assert from "node:assert/strict"
import { cloudinaryUrl, optimizeArticleImages } from "../lib/cloudinary.ts"

const ROOT = "https://res.cloudinary.com/da1coaysi/image/upload"
const ASSET = `${ROOT}/v1786032775/pure-grain-exports/raw-leather/calf/01.jpg`

describe("cloudinaryUrl", () => {
  test("inserts the transformation after /upload/ and keeps the version", () => {
    assert.equal(
      cloudinaryUrl(ASSET, { width: 828 }),
      `${ROOT}/f_auto,q_auto,c_limit,w_828/v1786032775/pure-grain-exports/raw-leather/calf/01.jpg`,
    )
  })

  test("defaults to automatic format and quality with no resize", () => {
    assert.equal(cloudinaryUrl("folder/photo.jpg"), `${ROOT}/f_auto,q_auto/folder/photo.jpg`)
  })

  test("supports crops, explicit quality and DPR", () => {
    assert.equal(
      cloudinaryUrl("a.jpg", { width: 300, height: 300, crop: "fill", gravity: "auto", quality: 80, dpr: 2 }),
      `${ROOT}/f_auto,q_80,c_fill,g_auto,w_300,h_300,dpr_2/a.jpg`,
    )
  })

  test("delivers mapped /public photographs from Cloudinary", () => {
    assert.equal(
      cloudinaryUrl("/hero-leather-warm.jpg", { width: 640 }),
      `${ROOT}/f_auto,q_auto,c_limit,w_640/v1793749761/site-assets/hero-leather-warm.jpg`,
    )
  })

  test("leaves sources Cloudinary does not hold unchanged", () => {
    for (const src of [
      "/ui/sticker.png",
      "/placeholder.svg?height=800&width=600",
      "blob:https://site/abc",
      "data:image/png;base64,AAAA",
      "https://images.unsplash.com/photo-1?w=1200",
      "https://res.cloudinary.com/da1coaysi/raw/upload/v1/spec.pdf",
    ]) {
      assert.equal(cloudinaryUrl(src, { width: 640 }), src)
    }
  })
})

describe("optimizeArticleImages", () => {
  test("adds a responsive srcset and lazy loading to Cloudinary images", () => {
    const html = optimizeArticleImages(`<p>x</p><img src="${ASSET}" alt="Calf" width="800" height="800">`)
    assert.match(html, /srcset="[^"]*w_256[^"]* 256w, [^"]*w_828[^"]* 828w"/)
    assert.match(html, /sizes="[^"]+"/)
    assert.match(html, /loading="lazy"/)
    assert.match(html, /alt="Calf" width="800" height="800"/)
  })

  test("does not touch local images or tags that already have a srcset", () => {
    const local = `<img src="/ui/sticker.png" alt="">`
    const done = `<img src="${ASSET}" srcset="a 1x" alt="">`
    assert.equal(optimizeArticleImages(local), local)
    assert.equal(optimizeArticleImages(done), done)
  })
})
