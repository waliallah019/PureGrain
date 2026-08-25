/**
 * Industry landing pages, and the hub that links to them.
 *
 * `/industries` is the hub; every industry it lists now has a dedicated page,
 * so there are no dead ends. Two industries that previously appeared on the hub
 * (Sports Goods, Saddlery & Equestrian) were removed rather than given pages —
 * see REMOVED_FROM_HUB for the evidence.
 *
 * Every specification quoted was checked against the live `rawleathers` and
 * `finishedproducts` collections. Substances render from the catalogue at
 * request time (see `getCatalogueStats`) rather than being written into the
 * copy, so a page cannot keep advertising stock we no longer hold.
 *
 * IMAGES: all assets are first-party — either files in `public/` or Pure Grain
 * product photography on Cloudinary. The hub previously hotlinked eight
 * Unsplash URLs, three of which had started returning 404, and the "footwear"
 * one was a knitted synthetic trainer carrying another brand's logo.
 */

export type IndustrySlug =
  | "footwear"
  | "bags"
  | "garment"
  | "accessories"
  | "gloves"
  | "automotive"
  | "upholstery"
  | "motorcycle"
  | "gifting"

export type IndustryPage = {
  slug: IndustrySlug
  path: string
  /** Anchor id used for the hub card and in-page nav. */
  hubAnchor: string
  /** Descriptive anchor text used when linking from the hub. */
  hubLinkText: string
  h1: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  shortLabel: string
  /** One-line summary shown on the hub card. */
  hubSummary: string
  /** Longer positioning statement under the H1. */
  positioning: string
  /** First-party image: a path under public/ or a Cloudinary URL. */
  image: string
  imageAlt: string
  /** Animals we actually stock for this use, in priority order. */
  animals: Array<"Cow" | "Buffalo" | "Goat" | "Sheep">
  leatherTypes: string[]
  catalogueHref: string
  /**
   * Finished-goods `productType` values we manufacture for this industry, or an
   * empty array when we supply material only. Drives whether the page carries a
   * private-label section at all.
   */
  oemProductTypes: string[]
  relatedGuides: Array<{ href: string; label: string }>
}

const CLOUDINARY = "https://res.cloudinary.com/da1coaysi/image/upload"

export const INDUSTRY_PAGES: Record<IndustrySlug, IndustryPage> = {
  footwear: {
    slug: "footwear",
    path: "/leather-for-footwear-manufacturers",
    hubAnchor: "footwear",
    hubLinkText: "Leather for Footwear Manufacturers",
    h1: "Leather for Footwear Manufacturers",
    seoTitle: "Leather for Footwear Manufacturers | Bulk Hides",
    seoDescription:
      "Bulk leather hides for footwear manufacturing — uppers, linings and quarters. Cowhide, buffalo and goat in verified substances, graded per batch.",
    keywords: [
      "leather for footwear manufacturers",
      "shoe upper leather wholesale",
      "footwear leather supplier Pakistan",
      "bulk shoe leather hides",
    ],
    shortLabel: "Footwear",
    hubSummary:
      "Upper, lining and quarter leather in footwear substances — full-grain, nubuck and corrected grain for volume lines.",
    positioning:
      "We supply hides by the square foot to shoe factories and footwear brands — cut-ready material with documented substance, temper and grade, not a mixed pallet you have to sort.",
    image: `${CLOUDINARY}/v1786032775/pure-grain-exports/raw-leather/smooth-grain-calf-black/01-image_1.jpg`,
    imageAlt: "Smooth black calfskin hide, a typical footwear upper leather",
    animals: ["Cow", "Buffalo", "Goat"],
    leatherTypes: ["Smooth", "Nubuck", "Suede", "Pebble", "Embossed"],
    catalogueHref: "/catalog/raw-leather?material=cowhide",
    oemProductTypes: [],
    relatedGuides: [
      { href: "/blogs/bulk-finished-leather-hides-pakistan", label: "Bulk leather hides: types, tanning and ordering" },
      { href: "/blogs/how-to-verify-leather-supplier", label: "How to verify a leather supplier" },
    ],
  },

  bags: {
    slug: "bags",
    path: "/leather-for-bag-manufacturers",
    hubAnchor: "bags",
    hubLinkText: "Leather for Bag & Luggage Manufacturers",
    h1: "Leather for Bag & Luggage Manufacturers",
    seoTitle: "Leather for Bag Manufacturers | Hides & OEM Bags",
    seoDescription:
      "Bag leather by the square foot — full-grain, pull-up and veg-tan cowhide in structural substances. We also make finished backpacks, duffels and purses.",
    keywords: [
      "leather for bag manufacturers",
      "handbag leather wholesale",
      "bag leather supplier",
      "luggage leather hides bulk",
    ],
    shortLabel: "Bags & Luggage",
    hubSummary:
      "Structural substances for bags and luggage — plus finished backpacks, duffels and purses under your own label.",
    positioning:
      "Bag construction is unforgiving: panel tension, stress points and edge finishing all show. We supply the heavier substances bags actually need — and, if you would rather buy finished, we make the bags too.",
    image: `${CLOUDINARY}/v1786390870/pure-grain-exports/finished-products/dual-tone-genuine-leather-weekender-duffel-bag/01-02_13-1.jpg`,
    imageAlt: "Dual-tone leather weekender duffel bag made by Pure Grain Exports",
    animals: ["Cow", "Buffalo", "Goat"],
    leatherTypes: ["Veg Tan", "Pebble", "Smooth", "Embossed", "Pull-Up"],
    catalogueHref: "/catalog/raw-leather?material=cowhide",
    oemProductTypes: ["Backpack", "Duffle Bag", "Purse"],
    relatedGuides: [
      { href: "/blogs/custom-leather-bag-manufacturer", label: "Custom leather bag manufacturing guide" },
      { href: "/blogs/bulk-finished-leather-hides-pakistan", label: "Bulk leather hides: types, tanning and ordering" },
    ],
  },

  garment: {
    slug: "garment",
    path: "/leather-for-garment-manufacturers",
    hubAnchor: "fashion",
    hubLinkText: "Leather for Garment & Apparel Manufacturers",
    h1: "Leather for Garment & Apparel Manufacturers",
    seoTitle: "Leather for Garment Manufacturers | Apparel Hides",
    seoDescription:
      "Garment leather for apparel makers — lightweight goat, sheep and cow with genuine drape. Plus private-label jacket and motorcycle apparel from Sialkot.",
    keywords: [
      "leather for garment manufacturers",
      "garment leather wholesale",
      "apparel leather supplier",
      "jacket leather hides bulk",
    ],
    shortLabel: "Garment & Apparel",
    hubSummary:
      "Light substances with genuine drape for apparel — and finished outerwear, including CE-standard motorcycle gear.",
    positioning:
      "Garment leather lives or dies on drape and substance consistency across a size run. We supply the light substances apparel needs, and manufacture finished outerwear in the cluster that has been making it for Europe for decades.",
    image: `${CLOUDINARY}/v1786390935/pure-grain-exports/finished-products/urban-biker-leather-jacket/01-02_11-1-1.jpg`,
    imageAlt: "Urban biker leather jacket manufactured by Pure Grain Exports",
    animals: ["Goat", "Sheep", "Cow"],
    leatherTypes: ["Suede", "Nubuck", "Smooth", "Pebble"],
    catalogueHref: "/catalog/raw-leather?material=goat",
    oemProductTypes: [
      "Leather Jackets",
      "Biker Jackets",
      "Motorcyle Jacket",
      "Motorcycle Pants",
      "Motorcycle Suit",
    ],
    relatedGuides: [
      { href: "/blogs/private-label-leather-jacket-manufacturer", label: "Private-label leather jacket manufacturing" },
      { href: "/blogs/pakistan-vs-china-leather-sourcing", label: "Pakistan vs China for leather sourcing" },
    ],
  },

  accessories: {
    slug: "accessories",
    path: "/leather-for-accessory-manufacturers",
    hubAnchor: "accessories",
    hubLinkText: "Leather for Belt, Wallet & Small Goods Manufacturers",
    h1: "Leather for Belt, Wallet & Small Leather Goods Manufacturers",
    seoTitle: "Leather for Belt & Wallet Manufacturers | Strap Hides",
    seoDescription:
      "Strap and wallet leather by the square foot — firm cowhide and veg-tan in consistent substance. We also produce finished wallets and belts at low minimums.",
    keywords: [
      "leather for belt manufacturers",
      "wallet leather wholesale",
      "strap leather supplier",
      "small leather goods hides",
    ],
    shortLabel: "Belts, Wallets & Small Goods",
    hubSummary:
      "Firm, consistent substances for straps and small goods — and our deepest finished line, at the lowest minimums we offer.",
    positioning:
      "Small leather goods expose everything: substance consistency, skiving, edge finish. This is our deepest line — both the hides and the finished product — and it carries our lowest minimums.",
    image: "/leather-accessories-collection-display.jpg",
    imageAlt: "Display of finished leather accessories including wallets and belts",
    animals: ["Cow", "Goat"],
    leatherTypes: ["Veg Tan", "Smooth", "Embossed", "Pebble"],
    catalogueHref: "/catalog/raw-leather?material=cowhide",
    oemProductTypes: ["Wallet", "Belt", "Purse"],
    relatedGuides: [
      { href: "/blogs/custom-leather-wallet-manufacturer", label: "Custom leather wallet manufacturing" },
      { href: "/blogs/oem-leather-belt-manufacturer", label: "OEM leather belt manufacturing" },
    ],
  },

  gloves: {
    slug: "gloves",
    path: "/leather-for-glove-manufacturers",
    hubAnchor: "gloves",
    hubLinkText: "Leather for Glove Manufacturers",
    h1: "Leather for Glove Manufacturers",
    seoTitle: "Leather for Glove Manufacturers | Goat & Sheep Skins",
    seoDescription:
      "Glove leather from Pakistan — goat and sheep skins with the stretch and tensile strength glove cutting demands, from the Sialkot cluster.",
    keywords: [
      "leather for glove manufacturers",
      "glove leather supplier",
      "goat nappa glove leather",
      "sheep skin glove leather wholesale",
    ],
    shortLabel: "Gloves",
    hubSummary:
      "Goat and sheep skins in light substances, cut-direction critical, from the Sialkot glove cluster.",
    positioning:
      "Glove leather is the most demanding light-substance product we sell: it has to stretch in one direction, hold a seam, and stay consistent across hundreds of small panels. We supply goat and sheep from the Sialkot cluster.",
    image: `${CLOUDINARY}/v1776538766/raw-leather/1776538766711-677773164.jpg`,
    imageAlt: "Goat nubuck skin showing grain and nap sides, the standard glove leather",
    animals: ["Goat", "Sheep"],
    leatherTypes: ["Smooth", "Suede", "Nubuck", "Pebble"],
    catalogueHref: "/catalog/raw-leather?material=goat",
    oemProductTypes: [],
    relatedGuides: [
      { href: "/blogs/leather-manufacturers-pakistan-export-guide", label: "Leather manufacturers in Pakistan: a buyer's guide" },
      { href: "/blogs/bulk-finished-leather-hides-pakistan", label: "Bulk leather hides: types, tanning and ordering" },
    ],
  },

  automotive: {
    slug: "automotive",
    path: "/leather-for-automotive-manufacturers",
    hubAnchor: "automotive",
    hubLinkText: "Leather for Automotive & Marine Trim",
    h1: "Leather for Automotive & Marine Trim",
    seoTitle: "Leather for Automotive & Marine Trim | Bulk Hides",
    seoDescription:
      "Leather for automotive and marine trim — seat facings, panels and steering covers for restoration, retrim and aftermarket work. Pebble and smooth cowhide.",
    keywords: [
      "automotive leather supplier",
      "car upholstery leather wholesale",
      "marine leather hides",
      "retrim leather bulk",
    ],
    shortLabel: "Automotive & Marine",
    hubSummary:
      "Trim leather for restoration, retrim and aftermarket programmes — with an honest account of what OEM tier-one supply would require.",
    positioning:
      "We supply trim leather to restoration shops, retrimmers and aftermarket programmes. We are direct about the boundary: tier-one OEM seat supply is an approvals-gated business, and this page explains exactly where our capability starts and stops.",
    image: "/leather-automotive.jpg",
    imageAlt: "Black pebble-grain leather of the kind used for automotive trim",
    animals: ["Cow", "Buffalo"],
    leatherTypes: ["Pebble", "Smooth", "Embossed"],
    catalogueHref: "/catalog/raw-leather?material=cowhide",
    oemProductTypes: [],
    relatedGuides: [
      { href: "/blogs/bulk-finished-leather-hides-pakistan", label: "Bulk leather hides: types, tanning and ordering" },
      { href: "/blogs/how-to-verify-leather-supplier", label: "How to verify a leather supplier" },
    ],
  },

  upholstery: {
    slug: "upholstery",
    path: "/leather-for-furniture-manufacturers",
    hubAnchor: "furniture",
    hubLinkText: "Leather for Furniture & Upholstery Manufacturers",
    h1: "Leather for Furniture & Upholstery Manufacturers",
    seoTitle: "Leather for Furniture Manufacturers | Upholstery Hides",
    seoDescription:
      "Upholstery leather by the square foot for furniture makers — aniline, semi-aniline and pebble cowhide, graded per batch with test reports on request.",
    keywords: [
      "upholstery leather wholesale",
      "furniture leather supplier",
      "aniline upholstery hides",
      "sofa leather bulk",
    ],
    shortLabel: "Furniture & Upholstery",
    hubSummary:
      "Aniline, semi-aniline and pebble cowhide for seating and panels, quoted per square foot with grading documented per batch.",
    positioning:
      "Furniture leather is bought on yield and consistency, not on a per-square-foot headline. We grade and document per batch, and we are explicit about which performance tests we can arrange rather than implying we hold them.",
    image: "/leather-upholstery.jpg",
    imageAlt: "Soft upholstery leather with a natural aniline finish",
    animals: ["Cow", "Buffalo"],
    leatherTypes: ["Aniline", "Semi-Aniline", "Pebble", "Smooth", "Pull-Up"],
    catalogueHref: "/catalog/raw-leather?material=cowhide",
    oemProductTypes: [],
    relatedGuides: [
      { href: "/blogs/bulk-finished-leather-hides-pakistan", label: "Bulk leather hides: types, tanning and ordering" },
      { href: "/blogs/leather-manufacturers-pakistan-export-guide", label: "Leather manufacturers in Pakistan: a buyer's guide" },
    ],
  },
  motorcycle: {
    slug: "motorcycle",
    path: "/leather-for-motorcycle-manufacturers",
    hubAnchor: "motorcycle",
    hubLinkText: "Leather for Motorcycle & Powersports Manufacturers",
    h1: "Leather for Motorcycle & Powersports Manufacturers",
    seoTitle: "Leather for Motorcycle Manufacturers | CE Apparel",
    seoDescription:
      "Heavy cowhide for motorcycle apparel, plus private-label production of CE-standard touring jackets, armoured pants and racing suits from Sialkot.",
    keywords: [
      "motorcycle leather manufacturer",
      "CE motorcycle apparel supplier",
      "racing suit manufacturer Pakistan",
      "armoured motorcycle leather",
    ],
    shortLabel: "Motorcycle & Powersports",
    hubSummary:
      "Abrasion-rated cowhide and finished CE-standard gear — touring jackets, armoured pants and racing suits.",
    positioning:
      "Motorcycle apparel is protective equipment, not outerwear that happens to look tough. This is our deepest manufacturing line, in the cluster that has built it for European brands for decades.",
    image: `${CLOUDINARY}/v1786390937/pure-grain-exports/finished-products/men-s-army-green-adventure-touring-motorcycle-suit/01-02_1-5-5.jpg`,
    imageAlt: "Armoured touring motorcycle suit manufactured by Pure Grain Exports",
    animals: ["Cow", "Buffalo"],
    leatherTypes: ["Smooth", "Pebble", "Embossed"],
    catalogueHref: "/catalog/finished-products",
    oemProductTypes: [
      "Motorcyle Jacket",
      "Motorcycle Pants",
      "Motorcycle Suit",
      "Biker Jackets",
    ],
    relatedGuides: [
      { href: "/blogs/private-label-leather-jacket-manufacturer", label: "Private-label leather jacket manufacturing" },
      { href: "/blogs/leather-manufacturers-pakistan-export-guide", label: "Leather manufacturers in Pakistan: a buyer's guide" },
    ],
  },

  gifting: {
    slug: "gifting",
    path: "/leather-for-corporate-gifting",
    hubAnchor: "corporate-gifting",
    hubLinkText: "Leather for Corporate Gifting & Promotional Programmes",
    h1: "Leather for Corporate Gifting & Promotional Programmes",
    seoTitle: "Corporate Gifting Leather | Branded, Low Minimums",
    seoDescription:
      "Branded leather gifts in short runs — wallets, folios, card holders and belts with in-house embossing, custom edge paint and retail-ready boxing.",
    keywords: [
      "corporate gifting leather supplier",
      "branded leather gifts wholesale",
      "promotional leather goods manufacturer",
      "custom embossed leather gifts",
    ],
    shortLabel: "Corporate Gifting",
    hubSummary:
      "Short branded runs — wallets, folios and card holders with in-house embossing and retail-ready boxing.",
    positioning:
      "Gifting programmes run on short, branded runs rather than long production lines. Our small leather goods carry the lowest minimums we offer, and every branding step happens in house.",
    image: "/collection.png",
    imageAlt: "Flat-lay of branded leather wallets, folios and small accessories",
    animals: ["Cow", "Goat"],
    leatherTypes: ["Smooth", "Embossed", "Veg Tan", "Pebble"],
    catalogueHref: "/catalog/finished-products",
    oemProductTypes: ["Wallet", "Belt", "Purse"],
    relatedGuides: [
      { href: "/blogs/custom-leather-wallet-manufacturer", label: "Custom leather wallet manufacturing" },
      { href: "/blogs/oem-leather-belt-manufacturer", label: "OEM leather belt manufacturing" },
    ],
  },
}

/** Hub display order — heaviest capability first. */
export const INDUSTRY_ORDER: IndustrySlug[] = [
  "footwear",
  "gloves",
  "motorcycle",
  "upholstery",
  "automotive",
  "bags",
  "accessories",
  "garment",
  "gifting",
]

export const INDUSTRY_PAGE_LIST: IndustryPage[] = INDUSTRY_ORDER.map(
  (slug) => INDUSTRY_PAGES[slug]
)

/**
 * Industries dropped from the hub rather than given a page.
 *
 * Kept on record because "we did not get to it" and "the catalogue contradicts
 * the claim" are different things. Both become publishable the moment the
 * underlying stock exists.
 */
/**
 * Industries that used to appear on the hub and were replaced.
 *
 * Kept on record because the reasons are substantive: one of them was
 * advertising stock we cannot ship. Both were swapped for segments we can
 * evidence from the live catalogue rather than simply deleted.
 */
export const REPLACED_ON_HUB: Array<{
  label: string
  replacedBy: string
  reason: string
}> = [
  {
    label: "Saddlery & Equestrian",
    replacedBy: "Corporate Gifting & Promotional",
    reason:
      "The section specified 3.0-6.0mm vegetable-tanned. All 29 veg-tan hides in the catalogue are cowhide at 1.2-2.2mm, and the only stock at or above 3.0mm is four chrome-tanned buffalo hides, so bridle, harness and skirting leather at that substance cannot be shipped. Corporate gifting uses the small-leather-goods lines we genuinely hold, at the lowest minimums in the catalogue.",
  },
  {
    label: "Sports Goods",
    replacedBy: "Motorcycle & Powersports",
    reason:
      "Cow and buffalo at 1.1-2.2mm genuinely suits boxing and cricket equipment, but there is no sports-specific stock, product line or test data behind it. Motorcycle and powersports is the opposite case: 98 live SKUs across touring jackets, armoured pants and racing suits, and the deepest manufacturing capability in the business.",
  },
]

export function industryByPath(path: string): IndustryPage | undefined {
  const normalised = path.replace(/\/+$/, "")
  return INDUSTRY_PAGE_LIST.find((i) => i.path === normalised)
}
