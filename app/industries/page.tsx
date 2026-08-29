// app/industries/page.tsx
"use client";

import "./industries.css";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { INDUSTRY_PAGE_LIST } from "@/lib/industries";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// ---------------------------------------------------------------------------
// Industry data — kept in one place so the anchor nav, sections, and
// schema/SEO downstream can all read from a single source of truth.
// ---------------------------------------------------------------------------
type HideKind = "cow" | "buffalo" | "goat" | "sheep";

interface IndustrySpec {
  thickness: string;
  temper: string;
  finish: string;
  tanning: string;
}

interface Industry {
  id: string;
  shortLabel: string;          // for the anchor pill
  pillIcon: string;            // FA icon for pill
  imageUrl: string;            // industry-specific image
  imageAlt: string;            // accessible description for the image
  imagePosition?: string;      // optional crop tuning per image
  caption: string;             // small uppercase line on the visual
  label: string;               // small gold uppercase label above heading
  name: string;                // H2
  pakNote: string;             // italic Pakistan-advantage line
  body: string;                // paragraph
  hides: HideKind[];
  spec: IndustrySpec;
  products: string[];
  note?: string;               // optional amber note (e.g. REACH)
}

const INDUSTRIES: Industry[] = [
  {
    id: "footwear",
    shortLabel: "Footwear",
    pillIcon: "fa-shoe-prints",
    imageUrl:
      "https://res.cloudinary.com/da1coaysi/image/upload/v1786032775/pure-grain-exports/raw-leather/smooth-grain-calf-black/01-image_1.jpg",
    imageAlt: "Smooth black calfskin hide, a typical footwear upper leather.",
    imagePosition: "center 58%",
    caption: "Footwear Leather",
    label: "Industry 01",
    name: "Footwear",
    pakNote:
      "Pakistan is the world's 5th largest leather footwear exporter — our hides are engineered for footwear production.",
    body:
      "From luxury dress shoes and premium sneakers to safety boots and high-volume work footwear, our leather hides are selected and finished to meet the specific technical demands of footwear manufacturing. We supply both full grain for premium brands and corrected grain for high-volume production lines.",
    hides: ["cow", "buffalo", "goat"],
    spec: {
      thickness: "1.2 mm – 2.5 mm depending on application",
      temper: "Firm to medium (outsole to upper)",
      finish: "Full grain, corrected grain, nubuck, suede",
      tanning: "Chrome tanned (standard), veg tanned available on request",
    },
    products: [
      "Full Grain Leather",
      "Nubuck",
      "Split Leather",
      "Lining Leather",
      "Insole Leather",
    ],
  },
  {
    id: "gloves",
    shortLabel: "Gloves",
    pillIcon: "fa-hand-paper",
    imageUrl:
      "https://res.cloudinary.com/da1coaysi/image/upload/v1776538766/raw-leather/1776538766711-677773164.jpg",
    imageAlt: "Goat nubuck skin showing grain and nap sides, the standard glove leather.",
    caption: "Glove Leather",
    label: "Industry 02",
    name: "Gloves",
    pakNote:
      "Sialkot, Pakistan supplies over 40% of the world's leather gloves — we are at the heart of this industry.",
    body:
      "Pakistan — and Sialkot in particular — is the undisputed global capital of leather glove manufacturing. Our goat and sheep skin hides are specifically selected for glove production: thin, supple, with excellent tensile strength and a natural soft hand-feel. We supply tanneries and glove manufacturers across Europe and North America.",
    hides: ["goat", "sheep"],
    spec: {
      thickness: "0.5 mm – 0.9 mm",
      temper: "Very soft, excellent drape",
      finish: "Nappa, peccary grain, unlined natural",
      tanning: "Chrome tanned — optimized for thin supple glove leather",
    },
    products: [
      "Glove Nappa",
      "Hair Sheep Skin",
      "Goat Nappa",
      "Driving Glove Leather",
      "Industrial Glove Leather",
    ],
  },
  {
    id: "motorcycle",
    shortLabel: "Motorcycle & Powersports",
    pillIcon: "fa-motorcycle",
    imageUrl:
      "https://res.cloudinary.com/da1coaysi/image/upload/v1786390937/pure-grain-exports/finished-products/men-s-army-green-adventure-touring-motorcycle-suit/01-02_1-5-5.jpg",
    imageAlt: "Armoured touring motorcycle suit manufactured by Pure Grain Exports.",
    caption: "Motorcycle Leather",
    label: "Industry 03",
    name: "Motorcycle & Powersports",
    pakNote:
      "Sialkot has supplied European motorcycle brands for decades — this is our deepest manufacturing line.",
    body:
      "Motorcycle apparel is a technical product, not a fashion one: armour pockets that sit correctly over a joint, abrasion-rated panels, stretch inserts and ventilation. We supply the heavy cowhide these garments require, and we manufacture the finished gear — touring jackets, armoured pants and one- and two-piece suits — under private label for brands in the EU, UK and North America.",
    hides: ["cow", "buffalo"],
    spec: {
      thickness: "1.2 mm – 2.2 mm",
      temper: "Firm, high abrasion resistance",
      finish: "Smooth, pebble, embossed",
      tanning: "Chrome tanned",
    },
    products: [
      "Touring Jacket Leather",
      "Racing Suit Leather",
      "Armoured Pant Leather",
      "Glove Panel Leather",
    ],
  },
  {
    id: "furniture",
    shortLabel: "Furniture & Interiors",
    pillIcon: "fa-couch",
    imageUrl:
      "/leather-upholstery.jpg",
    imageAlt: "Soft upholstery leather with a natural aniline finish.",
    caption: "Upholstery Leather",
    label: "Industry 04",
    name: "Furniture & Interiors",
    pakNote:
      "Cost-competitive upholstery hide with European-grade finishing — ideal for furniture manufacturers globally.",
    body:
      "Premium upholstery leather for sofas, lounge chairs, office seating, wall coverings, and high-end interior architectural applications. Our furniture hides combine aesthetic richness with technical durability — available in an extensive color palette with custom finishing and embossing options. Semi-aniline and protected finishes available for high-use applications.",
    hides: ["cow", "buffalo"],
    spec: {
      thickness: "1.0 mm – 1.4 mm",
      temper: "Soft to medium",
      finish: "Full aniline, semi-aniline, protected, pull-up",
      tanning: "Chrome tanned",
    },
    products: [
      "Upholstery Leather",
      "Semi-Aniline",
      "Protected Leather",
      "Pull-up Leather",
    ],
  },
  {
    id: "automotive",
    shortLabel: "Automotive & Marine",
    pillIcon: "fa-car",
    imageUrl:
      "/leather-automotive.jpg",
    imageAlt: "Black pebble-grain leather of the kind used for automotive trim.",
    caption: "Automotive Leather",
    label: "Industry 05",
    name: "Automotive & Marine",
    pakNote:
      "REACH-compliant automotive leather available — tested and documented for EU and North American OEM buyers.",
    body:
      "High-performance leather engineered for vehicle interiors — meeting stringent OEM durability, UV resistance, lightfastness, and cleanability specifications. Available in standard and perforated versions for heated and ventilated seat applications. Marine grade hides available with enhanced moisture and UV resistance for boat and yacht interior applications. REACH compliance documentation available upon request for all EU automotive buyers.",
    hides: ["cow"],
    spec: {
      thickness: "0.9 mm – 1.2 mm",
      temper: "Firm, consistent",
      finish: "Protected, perforated available",
      tanning: "Chrome tanned, REACH compliant",
    },
    products: [
      "Automotive Seat Leather",
      "Marine Grade Leather",
      "Perforated Leather",
      "Steering Wheel Wrap Leather",
    ],
    note:
      "REACH and restricted-substance test reports from accredited laboratories available upon request for all automotive and EU destination orders.",
  },
  {
    id: "bags",
    shortLabel: "Bags & Luggage",
    pillIcon: "fa-briefcase",
    imageUrl:
      "https://res.cloudinary.com/da1coaysi/image/upload/v1786390870/pure-grain-exports/finished-products/dual-tone-genuine-leather-weekender-duffel-bag/01-02_13-1.jpg",
    imageAlt: "Dual-tone leather weekender duffel bag made by Pure Grain Exports.",
    caption: "Bag Leather",
    label: "Industry 06",
    name: "Bags & Luggage",
    pakNote:
      "Full grain and veg-tanned hides that develop natural patina — preferred by premium bag manufacturers.",
    body:
      "Leather that combines visual beauty with structural integrity for handbags, briefcases, laptop bags, travel luggage, and premium leather goods. From vegetable-tanned full grain leathers that develop rich patina over time to consistent top grain for high-volume production runs — we supply hides to specification for both luxury and mass-market bag manufacturers.",
    hides: ["cow", "buffalo", "goat"],
    spec: {
      thickness: "1.0 mm – 2.0 mm",
      temper: "Firm to medium",
      finish: "Full grain, top grain, veg tanned, pull-up",
      tanning: "Chrome tanned, vegetable tanned",
    },
    products: [
      "Full Grain Leather",
      "Top Grain Leather",
      "Veg Tanned Leather",
      "Lining Leather",
      "Shoulder Leather",
    ],
  },
  {
    id: "accessories",
    shortLabel: "Accessories",
    pillIcon: "fa-watch",
    imageUrl: "/leather-accessories-collection-display.jpg",
    imageAlt: "Curated collection of premium leather accessories including wallets and small goods.",
    caption: "Small Goods Leather",
    label: "Industry 07",
    name: "Accessories",
    pakNote:
      "Fine grain consistency across small goods leather — ideal for belts, straps, and wallets.",
    body:
      "Specialized leather for watch straps, belts, wallets, key fobs, cardholders, and small leather goods. We offer finely finished hides in a wide range of colors and textures — with options for embossing, printing, and custom surface finishes for brand-specific accessory production.",
    hides: ["cow", "goat"],
    spec: {
      thickness: "0.8 mm – 1.5 mm",
      temper: "Firm, consistent hand",
      finish: "Full grain, embossed, printed grain, patent",
      tanning: "Chrome tanned",
    },
    products: [
      "Strap Leather",
      "Belt Leather",
      "Wallet Leather",
      "Embossed Grain Leather",
    ],
  },
  {
    id: "fashion",
    shortLabel: "Fashion & Apparel",
    pillIcon: "fa-tshirt",
    imageUrl:
      "https://res.cloudinary.com/da1coaysi/image/upload/v1786390935/pure-grain-exports/finished-products/urban-biker-leather-jacket/01-02_11-1-1.jpg",
    imageAlt: "Urban biker leather jacket manufactured by Pure Grain Exports.",
    caption: "Garment Leather",
    label: "Industry 08",
    name: "Fashion & Apparel",
    pakNote:
      "Lightweight goat nappa and buffalo suede from Pakistan — at a fraction of European cost.",
    body:
      "Supple, lightweight leathers for jackets, coats, trousers, skirts, and high-fashion garments. Our apparel leathers prioritize drape, handle, and comfort while maintaining the distinctive character of natural leather. Goat nappa is our flagship garment leather — renowned for its soft hand and consistent surface quality.",
    hides: ["goat", "cow", "buffalo"],
    spec: {
      thickness: "0.5 mm – 1.0 mm",
      temper: "Very soft, excellent drape",
      finish: "Nappa, suede, aniline, wax pull-up",
      tanning: "Chrome tanned",
    },
    products: [
      "Garment Leather",
      "Goat Nappa",
      "Suede",
      "Buffalo Suede",
      "Wax Finish Leather",
    ],
  },
  {
    id: "corporate-gifting",
    shortLabel: "Corporate Gifting",
    pillIcon: "fa-gift",
    imageUrl: "/collection.png",
    imageAlt: "Flat-lay of branded leather wallets, folios and small accessories.",
    caption: "Gifting Leather",
    label: "Industry 09",
    name: "Corporate Gifting & Promotional",
    pakNote:
      "Low minimums and in-house branding — the two things gifting programmes actually need.",
    body:
      "Corporate gifting runs on short, branded runs rather than long production lines: a few hundred wallets for a conference, folios for a sales team, belts and card holders as client gifts. Our small leather goods carry the lowest minimums we offer, and embossing, debossing, custom edge paint and retail-ready boxing are all done in house, so a programme can be branded end to end without a separate finisher.",
    hides: ["cow", "goat"],
    spec: {
      thickness: "1.1 mm – 2.2 mm",
      temper: "Firm, consistent hand",
      finish: "Smooth, embossed, veg tan, pebble",
      tanning: "Chrome tanned, vegetable tanned",
    },
    products: [
      "Wallet Leather",
      "Folio & Notebook Leather",
      "Card Holder Leather",
      "Keyring & Tag Leather",
    ],
  },
];

const HIDE_LABEL: Record<HideKind, string> = {
  cow: "Cowhide",
  buffalo: "Buffalo Hide",
  goat: "Goat Skin",
  sheep: "Hair Sheep Skin",
};

const HERO_STATS = [
  { value: "9+", label: "Industries Served" },
  { value: "40+", label: "Countries Exported To" },
  { value: "15+", label: "Years Export Experience" },
  { value: "500,000+", label: "Hides Exported Annually" },
];

const CERTS = [
  {
    icon: "fa-flask",
    title: "REACH Compliant",
    body:
      "Chemical compliance documentation available for all EU destination orders. Restricted substance test reports from accredited laboratories on request.",
  },
  {
    icon: "fa-search",
    title: "Third Party Inspection",
    body:
      "SGS, Intertek, and Bureau Veritas pre-shipment inspections available and welcomed at our facility before every shipment.",
  },
  {
    icon: "fa-certificate",
    title: "Halal Certified Hides",
    body:
      "All our raw hides are sourced from halal-slaughtered animals — certified and documented for buyers with halal sourcing requirements.",
  },
  {
    icon: "fa-file-alt",
    title: "Full Export Documentation",
    body:
      "Certificate of Origin, Quality Inspection Certificate, Packing List, and all trade documents prepared to LC and buyer specifications.",
  },
];

const WHY_CARDS = [
  {
    icon: "fa-map-marker-alt",
    title: "Pakistan Origin Advantage",
    body:
      "Direct from source — no middlemen. Pakistan is among the world's top leather exporters with centuries of tanning heritage.",
  },
  {
    icon: "fa-sliders-h",
    title: "Custom to Your Specification",
    body:
      "Thickness, temper, color, finish, and tanning method — all customizable to your exact production requirements.",
  },
  {
    icon: "fa-shield-alt",
    title: "Quality Before It Ships",
    body:
      "Every hide graded, inspected, and documented before dispatch. Third party inspection available on request.",
  },
  {
    icon: "fa-globe",
    title: "40+ Countries Served",
    body:
      "Reliable export experience across Europe, North America, the Middle East, and Asia — with full trade documentation.",
  },
  {
    icon: "fa-comments",
    title: "Direct Trade Communication",
    body:
      "Speak directly with our trade team — no intermediaries, no language barriers. Fast quotes, clear specs, honest answers.",
  },
  {
    icon: "fa-leaf",
    title: "Responsible Sourcing",
    body:
      "Halal-sourced raw hides, traceable supply chain, and tanneries committed to environmentally responsible practices.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function IndustriesPage() {
  const [activeId, setActiveId] = useState<string>(INDUSTRIES[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Reveal-on-scroll for any element with .reveal
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".industriesPage .reveal");
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

  // Track which industry section is in view to highlight its anchor pill
  useEffect(() => {
    const sections = INDUSTRIES.map((i) => sectionRefs.current[i.id]).filter(
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
      INDUSTRIES.map((_, i) =>
        i % 2 === 0 ? "indSection--cream" : "indSection--parchment"
      ),
    []
  );

  return (
    <div className="industriesPage">
      {/* External CDNs — Google Fonts + Font Awesome (kept consistent with
          /about and /quality) */}
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
        <nav className="indBreadcrumb" aria-label="Breadcrumb">
          <div className="indContainer">
            <Link href="/">Home</Link>
            <span className="indBreadcrumb__sep">/</span>
            <span className="indBreadcrumb__current">Industries We Serve</span>
          </div>
        </nav>

        {/* =============================== HERO =============================== */}
        <section className="indHero">
          <div className="indContainer">
            <div className="indHero__frame reveal">
              <p className="indHero__eyebrow">Global Leather Supply</p>
              <h1 className="indHero__title">Industries We Serve</h1>
              <p className="indHero__subtitle">
                From Lahore to the world — pure grain leather hides engineered
                for the specific demands of every industry we supply. Cowhide,
                buffalo hide, and goat skin for manufacturers and wholesalers
                across Europe, North America, and Asia.
              </p>
            </div>

            <div className="indHero__stats reveal">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="indHero__stat">
                  <p className="indHero__stat-value">{stat.value}</p>
                  <p className="indHero__stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================== ANCHOR NAV ============================= */}
        <nav className="indAnchorNav" aria-label="Industry sections">
          <div className="indContainer">
            <div className="indAnchorNav__inner">
              {INDUSTRIES.map((ind) => (
                <a
                  key={ind.id}
                  href={`#${ind.id}`}
                  className={`indAnchorPill ${
                    activeId === ind.id ? "is-active" : ""
                  }`}
                >
                  <i className={`fa-solid ${ind.pillIcon}`} aria-hidden="true" />
                  {ind.shortLabel}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* ========================= INDUSTRY SECTIONS ======================== */}
        {INDUSTRIES.map((ind, idx) => (
          <section
            key={ind.id}
            id={ind.id}
            ref={(el) => {
              sectionRefs.current[ind.id] = el;
            }}
            className={`indSection ${oddEvenBg[idx]}`}
          >
            <div className="indContainer">
              <div
                className={`indSection__grid ${
                  idx % 2 === 1 ? "indSection__grid--reverse" : ""
                }`}
              >
                {/* ------- Industry-specific photography ------- */}
                <div className="indSection__visual">
                  <div className="indVisual reveal">
                    <img
                      className="indVisual__image"
                      src={ind.imageUrl}
                      alt={ind.imageAlt}
                      loading="lazy"
                      decoding="async"
                      style={{ objectPosition: ind.imagePosition ?? "center" }}
                    />
                    <span className="indVisual__caption">{ind.caption}</span>
                  </div>
                </div>

                {/* ----------------------- Text content ---------------------- */}
                <div className="indSection__text reveal">
                  <p className="indLabel">{ind.label}</p>
                  <h2 className="indHeading">{ind.name}</h2>
                  <p className="indPakNote">{ind.pakNote}</p>
                  <p className="indBody">{ind.body}</p>

                  {/* Hide source tags */}
                  <div className="indHides">
                    <p className="indHides__label">Hide Source</p>
                    <div className="indHides__row">
                      {ind.hides.map((h) => (
                        <span
                          key={h}
                          className={`indHideTag indHideTag--${h}`}
                        >
                          <i
                            className="fa-solid fa-circle"
                            style={{ fontSize: 6 }}
                            aria-hidden="true"
                          />
                          {HIDE_LABEL[h]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/*
                Specification band.

                The spec table, product chips and actions used to sit at the
                bottom of the text column, which made that column 710-881px tall
                against a 423px image and left ~300px of dead space beside every
                photograph. Moving them below the two-column row caps the intro
                at roughly the image's own height, so the pair stays balanced
                whatever the copy length — and gives the detail a full-width
                strip to breathe in rather than a half-width stack.
              */}
              <div className="indDetail reveal">
                <div className="indDetail__col">
                  <p className="indDetail__label">Technical Specification</p>
                  <table className="indSpec">
                    <tbody>
                      <tr>
                        <th scope="row">Thickness</th>
                        <td>{ind.spec.thickness}</td>
                      </tr>
                      <tr>
                        <th scope="row">Temper</th>
                        <td>{ind.spec.temper}</td>
                      </tr>
                      <tr>
                        <th scope="row">Finish</th>
                        <td>{ind.spec.finish}</td>
                      </tr>
                      <tr>
                        <th scope="row">Tanning Method</th>
                        <td>{ind.spec.tanning}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Optional warning/info note (e.g. REACH for automotive) */}
                  {ind.note && (
                    <p className="indNote">
                      <i
                        className="fa-solid fa-circle-info"
                        aria-hidden="true"
                      />
                      {ind.note}
                    </p>
                  )}
                </div>

                <div className="indDetail__col">
                  {/* Popular products */}
                  <div className="indProducts">
                    <p className="indProducts__label">Popular Products</p>
                    <div className="indProducts__row">
                      {ind.products.map((p) => (
                        <span key={p} className="indProductTag">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="indDetail__col indDetail__col--act">
                  <p className="indDetail__label">Next step</p>

                  {/*
                    Deep link into the dedicated page for this industry.
                    A real anchor with descriptive text, sitting above the CTA
                    row so the existing Sample/Quote actions stay primary — this
                    is the crawl path from hub to detail page, so it must not be
                    a button or "Learn more".
                  */}
                  {(() => {
                    const detail = INDUSTRY_PAGE_LIST.find((d) => d.hubAnchor === ind.id);
                    if (!detail) return null;
                    return (
                      <p className="indDeepLink">
                        <Link href={detail.path}>{detail.hubLinkText}</Link>
                        <span className="indDeepLink__hint">
                          {" "}— substances, grades and sourcing detail
                        </span>
                      </p>
                    );
                  })()}

                  {/* CTAs */}
                  <div className="indCtaRow">
                    <Link
                      href={`/request-sample/pay?industry=${encodeURIComponent(ind.id)}`}
                      className="indBtn indBtn--primary"
                    >
                      <i className="fa-solid fa-paper-plane" aria-hidden="true" />{" "}
                      Request Samples
                    </Link>
                    <Link
                      href={`/quote-request?industry=${encodeURIComponent(ind.id)}`}
                      className="indBtn indBtn--ghost"
                    >
                      <i className="fa-solid fa-file-invoice" aria-hidden="true" />{" "}
                      Get a Quote
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* ====================== CERTIFICATIONS & COMPLIANCE ================== */}
        <section className="indCerts">
          <div className="indContainer">
            <div className="indCerts__head reveal">
              <h2 className="indCerts__title">
                Quality Certifications &amp; Compliance
              </h2>
              <p className="indCerts__sub">
                Our leather meets the standards demanded by the world's most
                rigorous buyers.
              </p>
            </div>
            <div className="indCerts__grid">
              {CERTS.map((c) => (
                <article key={c.title} className="indCertCard reveal">
                  <span className="indCertCard__icon" aria-hidden="true">
                    <i className={`fa-solid ${c.icon}`} />
                  </span>
                  <h3 className="indCertCard__title">{c.title}</h3>
                  <p className="indCertCard__body">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================== WHY US =============================== */}
        <section className="indWhy">
          <div className="indContainer">
            <div className="indWhy__head reveal">
              <h2 className="indWhy__title">
                Why Manufacturers Choose Pure Grain Exports
              </h2>
              <p className="indWhy__sub">
                Direct-from-source supply, full technical specification control,
                and trade discipline you can build a production line on.
              </p>
            </div>
            <div className="indWhy__grid">
              {WHY_CARDS.map((c) => (
                <article key={c.title} className="indWhyCard reveal">
                  <span className="indWhyCard__icon" aria-hidden="true">
                    <i className={`fa-solid ${c.icon}`} />
                  </span>
                  <h3 className="indWhyCard__title">{c.title}</h3>
                  <p className="indWhyCard__body">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================================ CTA ================================ */}
        <section className="indCta">
          <div className="indContainer reveal">
            <h2 className="indCta__title">Tell us what your line needs.</h2>
            <p className="indCta__sub">
              Share your specification — thickness, temper, finish, volume — and
              our trade team will respond with samples and a working quote.
              Wholesale orders ship via Letter of Credit; samples ship anywhere
              in the world.
            </p>
            <div className="indCta__row">
              <Link
                href="/request-sample/pay"
                className="indBtn indBtn--primary"
              >
                <i className="fa-solid fa-paper-plane" aria-hidden="true" />{" "}
                Request Free Samples
              </Link>
              <Link href="/quote-request" className="indBtn indBtn--ghost">
                <i className="fa-solid fa-file-invoice" aria-hidden="true" />{" "}
                Get a Quote
              </Link>
              <Link href="/contact" className="indBtn indBtn--dark">
                <i className="fa-solid fa-comments" aria-hidden="true" /> Talk to
                Trade Team
              </Link>
            </div>
            <div className="indCta__contact">
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
                <a href="mailto:sales@puregrainexports.com">
                  {" "}
                  sales@puregrainexports.com
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
