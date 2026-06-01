// app/products/page.tsx
"use client";

import "./products.css";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// ---------------------------------------------------------------------------
// Finished-product catalogue for B2B / private-label / OEM partners.
// One source of truth — anchor nav, sections, and (later) SEO read from here.
// ---------------------------------------------------------------------------
interface ProductSpec {
  range: string;       // SKU / type range
  leads: string;       // production lead time
  capacity: string;    // monthly capacity
  packaging: string;   // export packaging spec
}

interface ProductCategory {
  id: string;
  shortLabel: string;
  pillIcon: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition?: string;
  caption: string;
  label: string;
  name: string;
  tagline: string;     // italic positioning line under the heading
  body: string;
  variants: string[];  // chip list of typical product variants
  customisation: string[]; // bullet list of OEM customisation options
  spec: ProductSpec;
}

const PRODUCTS: ProductCategory[] = [
  {
    id: "jackets",
    shortLabel: "Jackets & Apparel",
    pillIcon: "fa-tshirt",
    imageUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16ebc5?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Premium leather jacket photographed for an editorial fashion catalogue.",
    caption: "Leather Apparel",
    label: "Category 01",
    name: "Leather Jackets & Apparel",
    tagline:
      "Built to your patterns, your sizing chart, your label — finished and shipped under your brand.",
    body:
      "Men's and women's leather jackets, biker jackets, bomber jackets, blazers, and outerwear produced to your tech-pack and fit specifications. Goat nappa, cowhide, and lambskin in a wide colour and finish range. Full pattern grading, sampling, and pre-production approval before bulk runs.",
    variants: [
      "Biker Jackets",
      "Bomber Jackets",
      "Classic Cafe Racer",
      "Leather Blazers",
      "Trench & Long Coats",
      "Vests",
    ],
    customisation: [
      "Your tech-pack & patterns",
      "Custom hardware (zippers, snaps, buckles)",
      "Branded inner labels & hang tags",
      "Custom lining (silk, polyester, quilted)",
      "Embroidered or debossed logos",
      "Pantone-matched colours",
    ],
    spec: {
      range: "Men's & women's, full size grading XS–4XL",
      leads: "45–60 days from approved sample",
      capacity: "8,000–12,000 units / month",
      packaging: "Individual poly bag + carton, branded hang tags optional",
    },
  },
  {
    id: "handbags",
    shortLabel: "Handbags & Totes",
    pillIcon: "fa-bag-shopping",
    imageUrl:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Premium leather handbag photographed in an editorial product shot.",
    caption: "Leather Handbags",
    label: "Category 02",
    name: "Handbags & Totes",
    tagline:
      "From luxury full-grain handbags to high-volume veg-tan totes — produced to spec and shipped under your label.",
    body:
      "Women's handbags, shoulder bags, crossbody bags, and totes manufactured to your design files. Full-grain Italian-style finishes, vegetable-tanned natural leathers, or chrome-tanned production-grade hides — your choice. Edge painting, hand stitching, and metal hardware finished to brand specification.",
    variants: [
      "Tote Bags",
      "Shoulder Bags",
      "Crossbody Bags",
      "Bucket Bags",
      "Hobo Bags",
      "Clutches",
    ],
    customisation: [
      "Your CAD / pattern files",
      "Branded hardware & zippers",
      "Custom lining & interior pockets",
      "Edge paint & stitching colour",
      "Embossed / debossed brand logo",
      "Dust bags & branded packaging",
    ],
    spec: {
      range: "Full design library or to your tech-pack",
      leads: "40–55 days from approved sample",
      capacity: "5,000–10,000 units / month / SKU",
      packaging: "Branded dust bag + tissue + export carton",
    },
  },
  {
    id: "backpacks",
    shortLabel: "Backpacks & Briefcases",
    pillIcon: "fa-briefcase",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Premium leather backpack laid on a wooden surface.",
    caption: "Briefcases & Backpacks",
    label: "Category 03",
    name: "Backpacks & Briefcases",
    tagline:
      "Executive-grade leather goods for travel and professional brands — built to last, finished to sell.",
    body:
      "Leather backpacks, laptop bags, briefcases, attaché cases, messenger bags, and weekenders. Full-grain construction with reinforced corners, premium hardware, dedicated laptop sleeves, and travel-ready interior organisation. Designed and built to handle daily commercial use.",
    variants: [
      "Executive Backpacks",
      "Laptop Briefcases",
      "Attaché Cases",
      "Messenger Bags",
      "Weekender Duffles",
      "Travel Holdalls",
    ],
    customisation: [
      "Padded laptop sleeves (13\"–17\")",
      "Trolley pass-through panels",
      "Custom interior organisation",
      "Branded zip pulls & hardware",
      "Embossed brand patches",
      "RFID-blocking lining options",
    ],
    spec: {
      range: "Standard library + bespoke patterns",
      leads: "45–60 days from approved sample",
      capacity: "4,000–8,000 units / month / SKU",
      packaging: "Dust bag + branded carton, retail-ready optional",
    },
  },
  {
    id: "wallets",
    shortLabel: "Wallets & Small Goods",
    pillIcon: "fa-wallet",
    imageUrl: "/luxury-leather-wallet-finished-product.jpg",
    imageAlt: "Finished luxury leather wallet shown as a wholesale product sample.",
    caption: "Wallets & Small Goods",
    label: "Category 04",
    name: "Wallets & Small Leather Goods",
    tagline:
      "High-margin small leather goods, manufactured at scale with luxury-grade finishing.",
    body:
      "Bifold and trifold wallets, cardholders, money clips, passport holders, key fobs, AirTag holders, and travel organisers. Saffiano, full-grain, vegetable-tanned, and embossed finishes. Skived edges, hand-painted edges, and turned-edge construction available depending on grade.",
    variants: [
      "Bifold Wallets",
      "Cardholders",
      "Money Clips",
      "Passport Holders",
      "Key Fobs",
      "AirTag Holders",
    ],
    customisation: [
      "Foil-stamped or debossed logos",
      "Custom Pantone-matched leather",
      "Branded edge paint",
      "RFID-blocking interlining",
      "Custom interior layout",
      "Branded gift packaging",
    ],
    spec: {
      range: "Catalogue + custom designs",
      leads: "30–45 days from approved sample",
      capacity: "20,000–30,000 units / month",
      packaging: "Branded gift box + outer carton",
    },
  },
  {
    id: "belts",
    shortLabel: "Belts",
    pillIcon: "fa-grip-lines",
    imageUrl: "/leather-accessories-collection-display.jpg",
    imageAlt: "Display of premium leather belts and accessories on a warm-toned surface.",
    caption: "Leather Belts",
    label: "Category 05",
    name: "Leather Belts",
    tagline:
      "Full-grain dress belts, casual belts, and reversible belts — built to your buckle and finish spec.",
    body:
      "Men's and women's belts in dress, casual, and reversible styles. Single-piece full-grain construction, edge-creased and edge-painted finishing, and custom buckle integration. We produce both standard catalogue belts and fully bespoke ranges to your buckle, leather, and packaging specification.",
    variants: [
      "Dress Belts",
      "Casual Belts",
      "Reversible Belts",
      "Braided Belts",
      "Western Belts",
      "Women's Fashion Belts",
    ],
    customisation: [
      "Custom buckles (your tooling)",
      "Engraved or embossed branding",
      "Edge paint colour matching",
      "Stitched or unstitched edges",
      "Skived loops & keepers",
      "Polybag, hanger, or boxed packaging",
    ],
    spec: {
      range: "Widths 25mm–40mm, sizing 28\"–46\"",
      leads: "30–45 days from approved sample",
      capacity: "25,000–40,000 units / month",
      packaging: "Polybag with header card or branded box",
    },
  },
  {
    id: "footwear",
    shortLabel: "Footwear",
    pillIcon: "fa-shoe-prints",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Premium leather shoes arranged for a commercial product image.",
    imagePosition: "center 58%",
    caption: "Leather Footwear",
    label: "Category 06",
    name: "Leather Footwear",
    tagline:
      "Cement-construction and Goodyear-welt leather shoes for premium and mid-market brands.",
    body:
      "Men's and women's dress shoes, loafers, derby shoes, boots, and chukkas built on your last and pattern. Full leather upper, lining, and insole construction; rubber, leather, or commando outsoles. Both cemented and Goodyear-welt construction available for premium product lines.",
    variants: [
      "Oxford Dress Shoes",
      "Derby Shoes",
      "Loafers",
      "Chelsea Boots",
      "Chukka Boots",
      "Leather Sneakers",
    ],
    customisation: [
      "Your last / pattern files",
      "Sole & welt construction options",
      "Pantone-matched leathers",
      "Branded insoles & sock liners",
      "Custom hardware & laces",
      "Branded shoeboxes",
    ],
    spec: {
      range: "Sizes EU 38–46 / US 5–13",
      leads: "60–75 days from approved sample",
      capacity: "5,000–8,000 pairs / month / style",
      packaging: "Tissue + dust bag + branded shoebox",
    },
  },
  {
    id: "gloves",
    shortLabel: "Gloves",
    pillIcon: "fa-mitten",
    imageUrl:
      "https://images.unsplash.com/photo-1587372915701-e8b3e7deefd4?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Pair of leather gloves photographed in a commercial studio.",
    caption: "Leather Gloves",
    label: "Category 07",
    name: "Leather Gloves",
    tagline:
      "Made in Sialkot — the global capital of leather glove manufacturing.",
    body:
      "Driving gloves, dress gloves, fashion gloves, work gloves, and motorcycle gloves. Goat nappa, hair sheep, and deer skin in a full range of finishes. Cashmere, silk, or fleece linings available. Hand-stitched constructions for premium product lines.",
    variants: [
      "Driving Gloves",
      "Dress Gloves",
      "Fashion Gloves",
      "Motorcycle Gloves",
      "Work Gloves",
      "Touchscreen Gloves",
    ],
    customisation: [
      "Choice of leather (goat / sheep / deer)",
      "Lined or unlined construction",
      "Cashmere, silk, or fleece lining",
      "Hand-stitched detailing",
      "Branded inner label",
      "Custom packaging",
    ],
    spec: {
      range: "Sizes XS–XXL, men's & women's",
      leads: "30–45 days from approved sample",
      capacity: "30,000–50,000 pairs / month",
      packaging: "Polybag, header card, or branded box",
    },
  },
  {
    id: "sports",
    shortLabel: "Sports Goods",
    pillIcon: "fa-futbol",
    imageUrl:
      "https://images.unsplash.com/photo-1597332677041-8ec7b0b9d55f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Leather boxing gloves representing sports goods manufacturing.",
    caption: "Sports Equipment",
    label: "Category 08",
    name: "Sports Goods",
    tagline:
      "Sialkot manufactures 70% of the world's hand-stitched footballs — we produce sports goods for global brands.",
    body:
      "Hand-stitched leather and synthetic footballs (soccer balls), boxing gloves, MMA gloves, cricket equipment, baseball gloves, and protective sports gear. Match-grade and training-grade specifications. Full custom branding, panel printing, and packaging.",
    variants: [
      "Match Footballs",
      "Training Footballs",
      "Boxing Gloves",
      "MMA Gloves",
      "Cricket Gloves & Pads",
      "Goalkeeper Gloves",
    ],
    customisation: [
      "Custom panel printing",
      "Match-grade or training-grade",
      "Brand colour & logo placement",
      "Approved size & weight specs",
      "Retail or club packaging",
      "Bulk team / club configurations",
    ],
    spec: {
      range: "Match / training / club / promotional",
      leads: "35–50 days from approved sample",
      capacity: "20,000–40,000 units / month",
      packaging: "Polybag, retail box, or bulk carton",
    },
  },
  {
    id: "saddlery",
    shortLabel: "Saddlery & Equestrian",
    pillIcon: "fa-horse",
    imageUrl:
      "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Equestrian leather saddle and horse tack photographed outdoors.",
    caption: "Saddlery & Equestrian",
    label: "Category 09",
    name: "Saddlery & Equestrian",
    tagline:
      "Vegetable-tanned heavy leather saddlery — produced for equestrian brands worldwide.",
    body:
      "Saddles, bridles, halters, harnesses, riding chaps, dog collars, and equestrian leather goods. Vegetable-tanned saddlery leather built for stiffness, water resistance, and the ability to mould and shape. Hand-stitched construction available for premium product lines.",
    variants: [
      "English Saddles",
      "Western Saddles",
      "Bridles & Headstalls",
      "Halters",
      "Harnesses",
      "Riding Chaps & Dog Collars",
    ],
    customisation: [
      "Veg-tan natural or dyed finishes",
      "Hand-stitched or machine-stitched",
      "Custom hardware (buckles, dees)",
      "Stamped / tooled brand marks",
      "Padded leather & wool fittings",
      "Bulk or single-unit packaging",
    ],
    spec: {
      range: "Catalogue + custom saddle trees",
      leads: "60–90 days from approved sample",
      capacity: "1,500–3,000 units / month",
      packaging: "Wrapped + crated for export",
    },
  },
];

// ---------------------------------------------------------------------------
// Trust signals, OEM process, why-partner, terms, FAQ, hero stats
// ---------------------------------------------------------------------------
const HERO_STATS = [
  { value: "9", label: "Product Categories" },
  { value: "30+", label: "Countries Shipped" },
  { value: "15+", label: "Years OEM Experience" },
  { value: "100%", label: "Private-Label Capable" },
];

const TRUST_BAR = [
  { icon: "fa-shield-halved", label: "REACH-compliant materials" },
  { icon: "fa-magnifying-glass", label: "Pre-shipment inspection welcomed" },
  { icon: "fa-file-contract", label: "NDA & exclusivity available" },
  { icon: "fa-globe", label: "DDP / CIF / FOB shipping" },
  { icon: "fa-handshake", label: "Long-term partnerships" },
];

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Brief & Tech-Pack",
    body:
      "Send us your tech-pack, sketches, or reference samples. We respond within 24 hours with feasibility, MOQs, and indicative pricing.",
  },
  {
    num: "02",
    title: "Sampling",
    body:
      "We produce a development sample to your spec, refine through 1–2 revisions, and send a final pre-production sample for your written approval.",
  },
  {
    num: "03",
    title: "Bulk Production",
    body:
      "Once you approve the PP sample and pay the agreed deposit, we schedule bulk production with full QC checkpoints at cutting, stitching, and finishing.",
  },
  {
    num: "04",
    title: "QC & Inspection",
    body:
      "Every order passes internal AQL inspection. We welcome SGS, Intertek, or Bureau Veritas third-party inspection at our facility before dispatch.",
  },
  {
    num: "05",
    title: "Export & Delivery",
    body:
      "Full export documentation, branded packaging, and DDP / CIF / FOB shipping to your warehouse. You receive the shipment ready to label and sell.",
  },
];

const WHY_CARDS = [
  {
    icon: "fa-tag",
    title: "Built for Private Label",
    body:
      "Your brand on every label, hang tag, dust bag, and carton. We never ship anything that says Pure Grain to your customers — your brand, your store, your reputation.",
  },
  {
    icon: "fa-file-shield",
    title: "NDA & IP Protection",
    body:
      "We sign mutual NDAs before reviewing your designs. Your patterns, tech-packs, and brand assets stay confidential and are never shared or used for other clients.",
  },
  {
    icon: "fa-circle-check",
    title: "Sample Before You Commit",
    body:
      "Every order starts with a paid development sample. You see, hold, and approve the exact product before any bulk production begins. No surprises at delivery.",
  },
  {
    icon: "fa-coins",
    title: "Direct Factory Pricing",
    body:
      "You buy direct from the manufacturer — no agents, no trading-house margins. The price you pay is the price the factory quotes, with full transparency on materials and labour.",
  },
  {
    icon: "fa-truck-fast",
    title: "Reliable Lead Times",
    body:
      "We commit to a delivery window in writing and we hit it. If we can't meet a deadline, we tell you before you pay the deposit — not after the order is in production.",
  },
  {
    icon: "fa-comments",
    title: "Direct English Communication",
    body:
      "Speak directly with our trade team in fluent English. No language barriers, no agents in the middle, no week-long email chains. Quick, clear, and accountable.",
  },
];

const TERMS = [
  {
    label: "MOQ",
    value: "100–500",
    body: "Per style. Lower MOQs available on small leather goods and accessories.",
  },
  {
    label: "Sample Lead Time",
    value: "10–21 days",
    body: "From signed tech-pack and sample fee. Sample fee credited against bulk order.",
  },
  {
    label: "Payment Terms",
    value: "30 / 70",
    body: "30% T/T deposit on PP sample approval, 70% balance against B/L copy.",
  },
  {
    label: "Shipping",
    value: "FOB / CIF / DDP",
    body: "Sea freight, air freight, or door-to-door DDP available globally.",
  },
];

const FAQS = [
  {
    q: "Can I sell the products under my own brand?",
    a: "Yes — every product is built for private-label sale. Your brand goes on the label, hang tag, packaging, and any printed inserts. We never ship Pure Grain branding to your customers unless you specifically request it.",
  },
  {
    q: "Do you sign NDAs and protect my designs?",
    a: "Always. We sign a mutual NDA before reviewing your tech-pack, sketches, or reference samples. Your patterns and brand assets are stored confidentially and never shared with or reused for other clients.",
  },
  {
    q: "What happens if the bulk order doesn't match the approved sample?",
    a: "Every bulk order is matched against the approved pre-production sample at our internal QC and at third-party inspection (your choice — SGS, Intertek, or Bureau Veritas). If a defect is documented, we replace or rework the affected units at our cost.",
  },
  {
    q: "Can I start small and scale up?",
    a: "Yes. We work with new brands on small first orders (often 100–300 units per style) and scale capacity with you as your sales grow. Repeat orders with the same tech-pack get faster lead times and better pricing.",
  },
  {
    q: "Do you handle shipping and customs?",
    a: "We handle FOB, CIF, and full DDP door-to-door shipping. For DDP we manage export clearance, ocean / air freight, import customs, and last-mile delivery to your warehouse — you receive a finished shipment ready to label and sell.",
  },
  {
    q: "Do you supply ready-made designs or only OEM?",
    a: "Both. We have an extensive catalogue of ready-made designs available for private-label production with your branding, and we manufacture fully bespoke products from your tech-pack. Many partners start with our catalogue and develop bespoke styles over time.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ProductsPage() {
  const [activeId, setActiveId] = useState<string>(PRODUCTS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Reveal-on-scroll for elements with .reveal
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".productsPage .reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Track the visible section to highlight its anchor pill
  useEffect(() => {
    const sections = PRODUCTS.map((p) => sectionRefs.current[p.id]).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top)
          );
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: "-200px 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const oddEvenBg = useMemo(
    () =>
      PRODUCTS.map((_, i) =>
        i % 2 === 0 ? "prSection--cream" : "prSection--parchment"
      ),
    []
  );

  return (
    <div className="productsPage">
      {/* External CDNs — Google Fonts + Font Awesome (kept consistent) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <Header />

      <main>
        {/* ============================ BREADCRUMB ============================ */}
        <nav className="prBreadcrumb" aria-label="Breadcrumb">
          <div className="prContainer">
            <Link href="/">Home</Link>
            <span className="prBreadcrumb__sep">/</span>
            <span className="prBreadcrumb__current">
              Finished Products &amp; Private Label
            </span>
          </div>
        </nav>

        {/* =============================== HERO =============================== */}
        <section className="prHero">
          <div className="prContainer">
            <div className="prHero__frame reveal">
              <p className="prHero__eyebrow">
                Private Label · OEM · Wholesale
              </p>
              <h1 className="prHero__title">
                Your Brand. Built in Pakistan. Shipped to the World.
              </h1>
              <p className="prHero__subtitle">
                We are the production partner behind leather brands across
                Europe, North America, and the Middle East. Send us your
                tech-pack — we manufacture, finish, label, and ship under your
                brand. No middlemen, no surprises, no shared supply chain.
              </p>
              <div className="prHero__ctaRow">
                <Link
                  href="/quote-request"
                  className="prBtn prBtn--primary"
                >
                  <i className="fa-solid fa-file-invoice" aria-hidden="true" />{" "}
                  Request a Production Quote
                </Link>
                <Link
                  href="/request-sample/pay"
                  className="prBtn prBtn--ghost"
                >
                  <i className="fa-solid fa-paper-plane" aria-hidden="true" />{" "}
                  Order a Production Sample
                </Link>
              </div>
            </div>

            <div className="prHero__stats reveal">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="prHero__stat">
                  <p className="prHero__stat-value">{stat.value}</p>
                  <p className="prHero__stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== TRUST BAR =========================== */}
        <section className="prTrustBar">
          <div className="prContainer">
            <div className="prTrustBar__row">
              {TRUST_BAR.map((t) => (
                <span key={t.label} className="prTrustBar__item">
                  <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* =========================== ANCHOR NAV ============================= */}
        <nav className="prAnchorNav" aria-label="Product categories">
          <div className="prContainer">
            <div className="prAnchorNav__inner">
              {PRODUCTS.map((p) => (
                <a
                  key={p.id}
                  href={`#${p.id}`}
                  className={`prAnchorPill ${
                    activeId === p.id ? "is-active" : ""
                  }`}
                >
                  <i className={`fa-solid ${p.pillIcon}`} aria-hidden="true" />
                  {p.shortLabel}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* ========================= PRODUCT SECTIONS ========================= */}
        {PRODUCTS.map((p, idx) => (
          <section
            key={p.id}
            id={p.id}
            ref={(el) => {
              sectionRefs.current[p.id] = el;
            }}
            className={`prSection ${oddEvenBg[idx]}`}
          >
            <div className="prContainer">
              <div
                className={`prSection__grid ${
                  idx % 2 === 1 ? "prSection__grid--reverse" : ""
                }`}
              >
                {/* ------------------- Product photography ------------------- */}
                <div className="prSection__visual">
                  <div className="prVisual reveal">
                    <img
                      className="prVisual__image"
                      src={p.imageUrl}
                      alt={p.imageAlt}
                      loading="lazy"
                      decoding="async"
                      style={{ objectPosition: p.imagePosition ?? "center" }}
                    />
                    <span className="prVisual__caption">{p.caption}</span>
                  </div>
                </div>

                {/* ------------------------- Text block ---------------------- */}
                <div className="prSection__text reveal">
                  <p className="prLabel">{p.label}</p>
                  <h2 className="prHeading">{p.name}</h2>
                  <p className="prTagline">{p.tagline}</p>
                  <p className="prBody">{p.body}</p>

                  {/* Variant chips */}
                  <div className="prVariants">
                    <p className="prVariants__label">Range</p>
                    <div className="prVariants__row">
                      {p.variants.map((v) => (
                        <span key={v} className="prVariantTag">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Customisation list */}
                  <ul className="prCustomList">
                    {p.customisation.map((c) => (
                      <li key={c}>
                        <i
                          className="fa-solid fa-check"
                          aria-hidden="true"
                        />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Capability table */}
                  <table className="prSpec">
                    <tbody>
                      <tr>
                        <th scope="row">Range</th>
                        <td>{p.spec.range}</td>
                      </tr>
                      <tr>
                        <th scope="row">Lead Time</th>
                        <td>{p.spec.leads}</td>
                      </tr>
                      <tr>
                        <th scope="row">Capacity</th>
                        <td>{p.spec.capacity}</td>
                      </tr>
                      <tr>
                        <th scope="row">Packaging</th>
                        <td>{p.spec.packaging}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* CTAs */}
                  <div className="prCtaRow">
                    <Link
                      href={`/quote-request?category=${encodeURIComponent(p.id)}`}
                      className="prBtn prBtn--primary"
                    >
                      <i className="fa-solid fa-file-invoice" aria-hidden="true" />{" "}
                      Request OEM Quote
                    </Link>
                    <Link
                      href={`/request-sample/pay?category=${encodeURIComponent(p.id)}`}
                      className="prBtn prBtn--ghost"
                    >
                      <i className="fa-solid fa-paper-plane" aria-hidden="true" />{" "}
                      Order Sample
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* ============================== OEM PROCESS ========================= */}
        <section className="prProcess">
          <div className="prContainer">
            <div className="prProcess__head reveal">
              <h2 className="prProcess__title">
                How a Production Partnership Works
              </h2>
              <p className="prProcess__sub">
                Our process is designed for foreign brand owners who need to
                trust their manufacturer before sending money or designs.
                Five clear stages, written commitments at every step.
              </p>
            </div>
            <div className="prProcess__steps">
              {PROCESS_STEPS.map((step) => (
                <article key={step.num} className="prStep reveal">
                  <p className="prStep__num">{step.num}</p>
                  <h3 className="prStep__title">{step.title}</h3>
                  <p className="prStep__body">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== WHY US ============================== */}
        <section className="prWhy">
          <div className="prContainer">
            <div className="prWhy__head reveal">
              <h2 className="prWhy__title">
                Why Brands Choose Us as Their Production Partner
              </h2>
              <p className="prWhy__sub">
                We are not a trading house, not a marketplace, and not an
                agent. We are the manufacturer — and we work like a long-term
                partner from the first email.
              </p>
            </div>
            <div className="prWhy__grid">
              {WHY_CARDS.map((c) => (
                <article key={c.title} className="prWhyCard reveal">
                  <span className="prWhyCard__icon" aria-hidden="true">
                    <i className={`fa-solid ${c.icon}`} />
                  </span>
                  <h3 className="prWhyCard__title">{c.title}</h3>
                  <p className="prWhyCard__body">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== TERMS / MOQ ========================= */}
        <section className="prTerms">
          <div className="prContainer">
            <div className="prTerms__head reveal">
              <h2 className="prTerms__title">Trade Terms at a Glance</h2>
              <p className="prTerms__sub">
                Standard terms — flexible by category and partnership history.
                Detailed pro-forma invoice provided with every quote.
              </p>
            </div>
            <div className="prTerms__grid">
              {TERMS.map((t) => (
                <article key={t.label} className="prTermCard reveal">
                  <p className="prTermCard__label">{t.label}</p>
                  <p className="prTermCard__value">{t.value}</p>
                  <p className="prTermCard__body">{t.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================================ FAQ =============================== */}
        <section className="prFaq">
          <div className="prContainer">
            <div className="prFaq__head reveal">
              <h2 className="prFaq__title">
                Questions Brand Owners Ask Us First
              </h2>
              <p className="prFaq__sub">
                The most common questions from foreign brand owners considering
                Pakistan as their production base.
              </p>
            </div>
            <div className="prFaq__list">
              {FAQS.map((item) => (
                <details key={item.q} className="prFaqItem reveal">
                  <summary>{item.q}</summary>
                  <p className="prFaqItem__body">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* =============================== FINAL CTA ========================== */}
        <section className="prCta">
          <div className="prContainer reveal">
            <h2 className="prCta__title">Become Our Next Brand Partner.</h2>
            <p className="prCta__sub">
              Send us your tech-pack, sketches, or reference samples. We will
              respond within 24 hours with feasibility, MOQs, indicative
              pricing, and a sample timeline. No obligations, no agents — just
              a direct conversation with the people who will build your
              product.
            </p>
            <div className="prCta__row">
              <Link href="/quote-request" className="prBtn prBtn--primary">
                <i className="fa-solid fa-file-invoice" aria-hidden="true" />{" "}
                Request a Production Quote
              </Link>
              <Link
                href="/request-sample/pay"
                className="prBtn prBtn--ghost"
              >
                <i className="fa-solid fa-paper-plane" aria-hidden="true" />{" "}
                Order a Production Sample
              </Link>
              <Link href="/contact" className="prBtn prBtn--dark">
                <i className="fa-solid fa-comments" aria-hidden="true" />{" "}
                Talk to Trade Team
              </Link>
            </div>
            <div className="prCta__contact">
              <span>
                <i className="fa-solid fa-location-dot" aria-hidden="true" />{" "}
                Lahore, Pakistan
              </span>
              <span>
                <i className="fa-solid fa-phone" aria-hidden="true" />
                <a href="tel:+923245243670"> +92 324 5243670</a>
              </span>
              <span>
                <i className="fa-solid fa-envelope" aria-hidden="true" />
                <a href="mailto:trade@puregrainexports.com">
                  {" "}
                  trade@puregrainexports.com
                </a>
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
