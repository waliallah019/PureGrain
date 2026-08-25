import type { Faq } from "@/lib/content/faqs"

/**
 * FAQ copy for the industry landing pages.
 *
 * Same contract as `lib/content/faqs.ts`: the page renders these and the page
 * also feeds them to `faqPageSchema()`, so the marked-up answers and the
 * visible answers are the same strings by construction.
 *
 * Every figure here is checked against the live catalogue. Where the hub page's
 * older copy overstated what we stock, these answers give the real range.
 */

export const FOOTWEAR_FAQS: readonly Faq[] = [
  {
    q: "What substance (thickness) do you supply for shoe uppers?",
    a: "Our cowhide runs roughly 1.1–2.2mm and buffalo up to 4.5mm. Uppers are typically taken at 1.4–1.8mm, linings from goat at 0.8–1.2mm. Tell us the component and we will confirm the exact substance available before you order, rather than shipping a nominal figure.",
  },
  {
    q: "Do you supply corrected-grain leather for volume production?",
    a: "Yes. Embossed and pebble-finished cowhide is our largest stocked group and is the usual choice for high-volume footwear where a uniform surface matters more than natural markings. Full-grain smooth and nubuck are available for premium lines.",
  },
  {
    q: "Can you supply sole, insole or welt leather?",
    a: "Not currently. Sole and welt leather is heavy vegetable-tanned stock at 3mm and above; all of our vegetable-tanned hides are cowhide at 1.2–2.2mm, which suits uppers and linings rather than bottoming. We would rather say so than take an order we cannot fill correctly.",
  },
  {
    q: "How is leather priced for footwear orders?",
    a: "Per square foot, against a specification. The rate depends on animal, tannage, substance, finish and grade, and bands down with volume. Send the component, substance and monthly requirement and we will quote against it.",
  },
  {
    q: "Can I see the leather before committing?",
    a: "Yes, and you should. Swatches are complimentary for verified trade buyers — you pay shipping only. Colour and temper cannot be judged from a photograph, and approving material from a screen is the most common cause of a rejected bulk shipment.",
  },
  {
    q: "What documentation ships with a footwear leather order?",
    a: "Commercial invoice, packing list with square footage per bundle, certificate of origin, and the bill of lading or air waybill. REACH declarations and chromium VI test reports are available on request, and a veterinary health certificate is issued where the destination requires one for animal-origin goods.",
  },
]

export const BAG_FAQS: readonly Faq[] = [
  {
    q: "What substance should I specify for a structured bag?",
    a: "As a rule: 1.2–1.6mm for soft, unstructured bags, 1.6–2.0mm for most backpacks and messengers, and 1.8mm and above where the bag must hold its shape empty. Our cowhide covers 1.1–2.2mm, and many good bags use a heavier leather for base and straps with a lighter one for the body.",
  },
  {
    q: "Do you stock vegetable-tanned leather for bags?",
    a: "Yes — vegetable-tanned cowhide is one of our larger stocked groups, in substances from 1.2mm to 2.2mm across a wide colour range. It tools and burnishes, and darkens with use, which is why heritage bag brands specify it.",
  },
  {
    q: "Can you manufacture the finished bags instead of supplying hides?",
    a: "Yes. We produce backpacks, weekender duffels and purses to order under your own label, with your choice of leather, lining, hardware and internal layout. Minimums and current pricing are shown on each catalogue listing.",
  },
  {
    q: "How do you keep panel colour consistent across one bag?",
    a: "We nest the panels for a single bag from the same hide wherever the pattern allows. Leather is a natural material and hides vary, so this costs some material yield — it is a step commonly skipped by factories quoting purely on price.",
  },
  {
    q: "Do you supply hardware as well as leather?",
    a: "For finished-goods orders, yes: zips, buckles, D-rings and rivets are sourced as part of the build, and custom branded hardware is available with a one-off mould or die cost on the first order. For hide-only orders we supply leather, not fittings.",
  },
  {
    q: "What is the lead time on a first bag order?",
    a: "Realistically four to five months end to end: swatch approval, 14–20 days for a first sample, usually one revision round, 35–50 days production, then freight. Repeat orders on an approved pattern run 8–10 weeks.",
  },
]

export const GARMENT_FAQS: readonly Faq[] = [
  {
    q: "What is the lightest substance you stock for garments?",
    a: "Goat and sheep from 0.8mm. If your specification calls for 0.5–0.7mm skins we would need to source them in rather than ship from stock, so tell us early — we would rather set that expectation than substitute a heavier skin and hope.",
  },
  {
    q: "Which leather should I choose for a jacket?",
    a: "For fashion outerwear, goat at 0.8–1.0mm gives the best combination of drape and strength for its weight, and sheep is softer still. For anything sold as motorcycle protective wear, cowhide at 1.2mm or heavier is the baseline for abrasion resistance — light skins have no place in a garment sold as protective.",
  },
  {
    q: "Do you manufacture finished garments as well as supplying leather?",
    a: "Yes. Sialkot has supplied European motorcycle brands for decades, and that is our deepest finished line: fashion and biker jackets plus CE-standard touring jackets, armoured pants and one- and two-piece suits, produced under your label.",
  },
  {
    q: "Are your motorcycle garments CE certified?",
    a: "We build to EN 17092 construction requirements and coordinate testing through a notified body. The certification is issued against your specific garment construction, in your name — it is not a blanket factory certificate, and any supplier describing it as one has misunderstood the regulation.",
  },
  {
    q: "How do you handle size grading?",
    a: "We work to your grade rules, or supply ours for your target market. Tell us the market at enquiry stage: US sizing runs fuller through chest and waist than EU at the same nominal size, and grading to the wrong market drives return rates. Approve a base-size fit sample before the range is graded.",
  },
  {
    q: "Can you match a colour across a production run?",
    a: "Yes, within the limits of a natural material. Order colour-critical quantities in a single dye lot rather than splitting across repeat orders, and we hold a retained swatch against your approved sample so any dispute is settled against a physical reference.",
  },
]

export const ACCESSORY_FAQS: readonly Faq[] = [
  {
    q: "What substance do you supply for belt straps?",
    a: "Belts want 3.0–4.0mm to resist stretching and cracking at the holes. Our stocked cowhide tops out at about 2.2mm, so we produce belts as finished goods using heavier stock sourced for the build rather than selling belt-weight strap leather by the square foot. For wallet and strap components at 1.1–2.2mm we supply from stock.",
  },
  {
    q: "What leather is best for wallets?",
    a: "Full-grain cowhide at roughly 1.0–1.4mm. Thinner feels flimsy and thicker will not fold cleanly or sit in a pocket. Choose the finish for the brand story: aniline and pull-up develop a patina, smooth and pebble stay consistent.",
  },
  {
    q: "Do you make finished wallets and belts, or only supply leather?",
    a: "Both, and this is our deepest finished line — wallets and belts together account for the majority of our finished-goods catalogue. Current unit prices and minimums are shown per listing and are quoted live rather than from a fixed price list.",
  },
  {
    q: "What are the minimums on finished small leather goods?",
    a: "These carry the lowest minimums we offer — low enough to validate a design before committing capital, and well below the 300–500 unit floors typical of large factories. The exact figure per line is on the catalogue listing.",
  },
  {
    q: "Can you emboss or deboss our logo?",
    a: "Yes. Both press your mark into the leather with a heated die. The die is a one-off tooling cost on the first order and is then stored and reused free on every repeat order, so it is cheap amortised and disproportionately expensive on a very small first run.",
  },
  {
    q: "What separates a good wallet from a cheap one?",
    a: "Four things: skiving at the fold lines so it closes flat, edge paint applied in thin sanded coats rather than one thick one, backstitching at pocket mouths, and card-slot tension that still holds a card after a year. Check those on any sample, from us or anyone else.",
  },
]

export const GLOVE_FAQS: readonly Faq[] = [
  {
    q: "What skins do you supply for glove manufacturing?",
    a: "Goat and sheep. Goat is the workhorse — strong for its weight with a fine natural grain — and sheep is softer with more stretch. Both are stocked from 0.8mm, with goat running up to about 1.4mm for heavier work gloves.",
  },
  {
    q: "Can you supply 0.5–0.7mm skins for dress gloves?",
    a: "Not from current stock. Our lightest stocked skins start at 0.8mm. Finer dress-glove substances would be sourced to order through the Sialkot cluster, which adds lead time — worth raising at enquiry stage rather than after sampling.",
  },
  {
    q: "How much leather do I need per pair?",
    a: "It depends entirely on pattern and size run, and glove cutting is unusually yield-sensitive because every panel must respect the direction of stretch. Send your pattern and size breakdown and we will work the requirement with you rather than quoting a generic figure.",
  },
  {
    q: "Why source glove leather from Pakistan?",
    a: "Sialkot is one of the world's principal glove manufacturing clusters, which means the tanning, grading and cutting skills sit in the same place. Hides are also a domestic by-product rather than an import, so the raw material does not carry an import cost layer.",
  },
  {
    q: "Do you manufacture finished gloves?",
    a: "No. We supply glove leather; we do not currently produce finished gloves. If you need finished glove production we would rather tell you that plainly than take the order and subcontract it without saying so.",
  },
  {
    q: "Is your leather REACH compliant for the EU market?",
    a: "Yes. Our chemistry complies with EU REACH restrictions including chromium VI, azo dyes and formaldehyde limits, which matters particularly for gloves given prolonged skin contact. Batch test reports are issued in your name on request.",
  },
]

export const AUTOMOTIVE_FAQS: readonly Faq[] = [
  {
    q: "Can you supply leather approved for a vehicle manufacturer's seat programme?",
    a: "Not today. Tier-one OEM supply requires manufacturer-specific material approvals, IMDS declarations and test data for fogging, heat ageing, UV and flammability against that manufacturer's own standard. We do not hold those approvals, and we would rather tell you at enquiry than fail an audit later. What we do supply is trim leather for retrim, restoration, marine and aftermarket work.",
  },
  {
    q: "What substance should I order for seat facings?",
    a: "Trim is usually taken at 1.1 to 1.4mm. That is heavy enough to wear well and light enough to pull cleanly over foam without bulking at the seams. Heavier substances fight the trimmer and show ripples at tight radii.",
  },
  {
    q: "Which finish holds up best in a car interior?",
    a: "Pebble and embossed grains. A cabin sees wide temperature swings, constant UV through glass and abrasion at the bolster every time someone gets in. A textured grain disguises that wear in a way a flat aniline surface cannot.",
  },
  {
    q: "Do you provide fogging and flammability test data?",
    a: "We can arrange it through an accredited third-party lab against the specific batch you are buying, at cost, with the report issued in your name. We do not advertise it as a certification we hold, because it is a property of a batch tested to a nominated standard rather than something a tannery carries permanently.",
  },
  {
    q: "How much leather does a full interior retrim take?",
    a: "It depends entirely on the vehicle and how much of the cabin is being covered, and seat panels are yield-sensitive because they are large and must be cut from matching areas of the hide. Send the panel set and we will work the requirement with you rather than quoting a generic figure.",
  },
  {
    q: "Can you match an existing interior colour?",
    a: "Yes, against a physical reference. Send the trim piece you are matching to rather than a photograph or a colour code from a screen. Order the whole job in one dye lot as well — a door card cut from a second lot next to a seat from the first is visible in daylight.",
  },
]

export const UPHOLSTERY_FAQS: readonly Faq[] = [
  {
    q: "How is upholstery leather priced?",
    a: "Per square foot, but the number that actually decides your cost is usable area per hide. Seat and back panels are large and rectangular while a hide is not, so a lower grade at a lower rate often costs more per finished panel once you cut around the neck, belly and natural markings.",
  },
  {
    q: "What yield should I plan for?",
    a: "Typically 65 to 80 percent depending on panel size and grade, with large single panels wasting considerably more than small ones. Order against that figure rather than against the sum of your pattern areas, or you will come up short mid-run.",
  },
  {
    q: "Do you hold Martindale or flammability certification?",
    a: "Not as standing certificates, and any supplier who says they do for leather is worth questioning. Abrasion cycles to your nominated threshold, and flammability to BS 5852 or California TB 117-2013, are arranged through an accredited lab against the batch you are buying, with the report issued in your name.",
  },
  {
    q: "What substance is right for seating?",
    a: "Around 1.1 to 1.4mm. Heavy enough to wear well and tailor cleanly over foam, light enough to pull around a corner without bulking. Specify a range rather than a single figure — leather is split to a tolerance, and demanding an exact number raises cost without improving the result.",
  },
  {
    q: "Aniline or semi-aniline for a family sofa?",
    a: "Semi-aniline in almost every case. Full aniline gives the deepest colour and the most natural surface, but it has no pigment layer to resist staining and it shows every mark. Semi-aniline keeps most of the depth with meaningfully better resistance to household use.",
  },
  {
    q: "How do I avoid disputes over natural markings?",
    a: "Agree in writing, before production, what level of natural marking is acceptable for your grade. Scars, insect bites and growth lines are characteristics of a natural material rather than defects, and this is the single most common source of upholstery disputes — and entirely preventable.",
  },
]

export const MOTORCYCLE_FAQS: readonly Faq[] = [
  {
    q: "Who holds the CE certificate, us or you?",
    a: "You do. We build to EN 17092 construction requirements and coordinate testing through a notified body, and the certificate is issued against your specific garment construction in your name. It is not a blanket factory certificate — a supplier who describes it that way has misunderstood the regulation, and the distinction matters if you are selling into the EU or UK.",
  },
  {
    q: "What leather weight do you use for protective gear?",
    a: "Cowhide at 1.2mm or heavier. That is the baseline for abrasion resistance in a garment sold as protective. Lighter skins drape better and belong in fashion outerwear; we will say so rather than build a jacket that looks the part and does not perform.",
  },
  {
    q: "Do you supply the armour or do we?",
    a: "Either. We can supply CE Level 1 or Level 2 inserts for shoulder, elbow, back, hip and knee, or build the garment to accept armour you nominate. Many brands prefer to specify their own armour supplier for consistency across their range, which we accommodate.",
  },
  {
    q: "Can you make one-piece racing suits?",
    a: "Yes. Suits are the most technically demanding garment we produce — speed humps, accordion stretch panels, external sliders and full armour provision — and they are a live line in our catalogue rather than something we would be attempting for the first time on your order.",
  },
  {
    q: "How many fit samples will we need?",
    a: "At least one base-size sample, and for a first programme we recommend two: a base size to confirm the block, then a graded size to verify your grade rules. Motorcycle garments are cut for a forward-leaning riding position, so a fit that works standing up can still be wrong on a bike.",
  },
  {
    q: "How long does a first motorcycle programme take?",
    a: "Budget four to five months: sampling and fit approval four to six weeks, production 35 to 50 days, then freight — plus certification time if you are selling protective gear, which depends on the notified body rather than on us. Repeat orders on an approved graded pattern run eight to ten weeks.",
  },
]

export const GIFTING_FAQS: readonly Faq[] = [
  {
    q: "What is the smallest gifting run you will take?",
    a: "Our small leather goods carry the lowest minimums in the catalogue, and the exact figure per line is shown on its listing. It is low enough for a conference or a team programme rather than the 300 to 500 unit floors typical of large factories.",
  },
  {
    q: "Can you emboss our logo, and what does the tooling cost?",
    a: "Yes. A die is a one-off cost on the first order and is then stored and reused free on every repeat, so it is disproportionately expensive on a single small run and negligible across an annual programme. Blind, foil and pigment-filled impressions are all available.",
  },
  {
    q: "Can you match our exact brand colour?",
    a: "On edge paint and pigment fill, closely — send a Pantone reference. On the leather itself, custom colour needs a dedicated dye lot and therefore a higher minimum, so for smaller runs it is usually better to choose from stocked colours and carry the brand through edge paint and branding instead.",
  },
  {
    q: "We have a fixed event date. Will you tell us if it is not achievable?",
    a: "Yes, and we would rather do that at enquiry than three weeks before. Send the date first. Sampling, tooling for a custom die and freight are the three things that most often make a gifting deadline impossible, and all of them are knowable up front.",
  },
  {
    q: "Do you supply gift packaging as well as the product?",
    a: "Yes — kraft sleeves, rigid two-piece gift boxes, care cards and retail cartons with barcodes. For a gift the packaging carries most of the perceived value because the recipient sees it first, so decide it before production rather than after: it changes unit cost, carton dimensions and freight.",
  },
  {
    q: "Can you produce folios, card holders or keyrings?",
    a: "Yes, to order. Wallets, belts and purses are held as catalogue lines with published pricing; folios, notebook covers, card holders and keyrings are produced against your specification. Send the piece you have in mind and we will quote it.",
  },
]

export const INDUSTRY_FAQS = {
  footwear: FOOTWEAR_FAQS,
  bags: BAG_FAQS,
  garment: GARMENT_FAQS,
  accessories: ACCESSORY_FAQS,
  gloves: GLOVE_FAQS,
  automotive: AUTOMOTIVE_FAQS,
  upholstery: UPHOLSTERY_FAQS,
  motorcycle: MOTORCYCLE_FAQS,
  gifting: GIFTING_FAQS,
} as const
