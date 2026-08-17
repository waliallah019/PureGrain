"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion"
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Beaker,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Fingerprint,
  FlaskConical,
  Gem,
  Handshake,
  Layers,
  Leaf,
  PackageCheck,
  Repeat2,
  Ruler,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Reveal, SectionHeading, Stagger, StaggerItem } from "@/components/landing/primitives"
import { PolicyHero } from "@/components/layout/policy-hero"

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

/** Rendered as the PolicyHero trust-chip row. */
const HERO_TRUST = [
  { icon: <ClipboardCheck size={14} />, label: "100% batch inspected" },
  { icon: <Award size={14} />, label: "4 global certifications" },
  { icon: <Repeat2 size={14} />, label: "6-step QC process" },
]

const AT_A_GLANCE = [
  "Certified to international standards including ISO 9001, ISO 14001, LWG, and REACH.",
  "Every batch undergoes a six-stage quality control process before dispatch.",
  "In-house laboratory testing verifies thickness, tensile strength, and surface finish.",
  "Full traceability from raw hide through finished export documentation.",
]

const GLANCE_CARDS = [
  {
    icon: BadgeCheck,
    title: "Certified Quality",
    body: "Operations independently audited against ISO, LWG, and REACH benchmarks recognised worldwide.",
  },
  {
    icon: Beaker,
    title: "Rigorous Testing",
    body: "In-house laboratory inspection of every batch for physical, chemical, and aesthetic conformity.",
  },
  {
    icon: Handshake,
    title: "Satisfaction Guaranteed",
    body: "Every shipment is backed by full documentation and a no-compromise quality assurance commitment.",
  },
]

/** The brand tagline, unpacked. This is the page's editorial centrepiece. */
const TAGLINE_PARTS = [
  {
    icon: Fingerprint,
    title: "The Grain",
    lede: "Nature's fingerprint — preserved, not hidden.",
    body: "We start with full-grain and top-grain hides where the natural pore structure, fibre density, and surface character are intact. We never sand away or print over the grain to disguise lower-quality leather — the grain is the proof.",
  },
  {
    icon: Gem,
    title: "Greatness",
    lede: "Finishing mastery applied with restraint.",
    body: "Greatness is the finish: aniline depth, semi-aniline clarity, pull-up warmth, nubuck softness. Our partner tanneries employ master finishers whose craft enhances the hide rather than masking it — colour, hand-feel, and lustre built up in measured layers.",
  },
  {
    icon: Handshake,
    title: "The Meeting Point",
    lede: "Heritage craft, export-ready discipline.",
    body: "Where these two forces meet is where Pure Grain Exports lives: hides selected for their natural integrity, finished by hands that have refined the craft over generations, and delivered with the documentation, testing, and traceability that international buyers require.",
  },
]

const CERTIFICATIONS = [
  { code: "ISO 9001:2015", label: "Quality Management System" },
  { code: "ISO 14001:2015", label: "Environmental Management" },
  { code: "LWG Certified", label: "Leather Working Group Gold" },
  { code: "REACH Compliant", label: "EU Chemical Regulation" },
]

const PILLARS = [
  {
    icon: Repeat2,
    title: "Consistency",
    body: "Batch-to-batch uniformity ensured through standardised processes and documented testing protocols.",
  },
  {
    icon: FlaskConical,
    title: "Testing",
    body: "An in-house laboratory conducts physical and chemical testing of every leather batch we release.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    body: "Eco-conscious practices including water recycling, chemical recovery, and responsible effluent management.",
  },
  {
    icon: ScanSearch,
    title: "Traceability",
    body: "Complete documentation from raw hide source through finished product, audit-ready at every stage.",
  },
]

/*
 * Stage 02 previously used /custom-leather-manufacturing-process.jpg — an
 * AI-generated collage whose captions read "Surang quality voriont", "Cutt and
 * shapeje rting acodig to ahiign" and "CUSTOM MANFACTUIING PROCESS". Garbled
 * machine text on a page titled "Quality Without Compromise" undercut the whole
 * argument, so it is replaced with a real tannery photograph.
 */
const STAGES = [
  {
    n: "01",
    icon: Layers,
    kicker: "Raw Material Selection",
    title: "Only the right hides enter the process",
    body: "We source hides exclusively from suppliers with documented traceability. Every hide is inspected against documented criteria for size, substance, scar density, and grain integrity before it is accepted into the production line.",
    points: [
      "Visual + tactile inspection of every hide",
      "Reject rate documented per supplier per batch",
      "Traceability tag attached at acceptance",
    ],
    image: "/premium-raw-leather-hide-texture.jpg",
    alt: "Raw leather hide showing natural grain and surface character",
  },
  {
    n: "02",
    icon: Droplets,
    kicker: "Tanning & Wet-Processing",
    title: "Modern chemistry, traditional discipline",
    body: "Hides are tanned using a combination of vegetable and chrome processes selected for the end-use specification. Water recycling, chemical recovery, and effluent management protect both leather quality and the surrounding environment.",
    points: [
      "pH, basicity, and shrinkage temperature checked at each drum",
      "REACH-compliant chemistry throughout",
      "Wet-blue inspected before crust stage",
    ],
    image: "/local/hide-preparation.jpg",
    alt: "Tannery floor with stacked hides and tanning drums in operation",
  },
  {
    n: "03",
    icon: Sparkles,
    kicker: "Finishing & Treatment",
    title: "The grain meets the master's hand",
    body: "This is the heart of Where Grain Meets Greatness. Colour, hand-feel, and surface character are built up in measured layers — aniline, semi-aniline, pull-up, nubuck, or pigmented finishes — each one chosen to enhance the natural grain rather than mask it.",
    points: [
      "Colour-matched to your approved master swatch",
      "Hand-feel and lustre verified by senior finisher",
      "Top-grain integrity preserved — never sanded or embossed over",
    ],
    image: "/leather-artisan-crafting-premium-leather-in-worksh.jpg",
    alt: "A finisher working leather by hand at the bench",
  },
  {
    n: "04",
    icon: Beaker,
    kicker: "Laboratory Quality Control",
    title: "Every batch tested — not just sampled",
    body: "Our in-house laboratory verifies every batch against your specification. Nothing advances on assumption — the data has to confirm what the eye sees.",
    points: [
      "Thickness consistency across the hide (calliper grid)",
      "Tensile strength & tear resistance per ISO 3376 / 3377",
      "Colour fastness to rub, light, and perspiration",
      "Chemical compliance — REACH, AZO, chromium VI",
    ],
    image: "/minimalist-leather-texture-close-up.jpg",
    alt: "Close inspection of a finished leather surface",
  },
  {
    n: "05",
    icon: Ruler,
    kicker: "Grading & Sorting",
    title: "Honest grading you can rely on",
    body: "Finished leather is graded hide-by-hide and sorted into the categories agreed in your specification. We grade conservatively — what we ship is at or above the grade declared on the documentation.",
    points: [
      "A / B / C grading per documented criteria",
      "Square-footage measured and stamped per hide",
      "Photographic record retained per batch",
    ],
    image: "/leather-fullgrain.jpg",
    alt: "Graded full-grain leather sorted for export",
  },
  {
    n: "06",
    icon: PackageCheck,
    kicker: "Final Inspection & Dispatch",
    title: "Documented, packed, sealed",
    body: "A final QC pass is performed against the original purchase order before the consignment is sealed. Export-grade packaging protects the leather in transit, and a complete documentation set accompanies every shipment.",
    points: [
      "Final pre-shipment inspection vs. PO",
      "Moisture-controlled, light-protected packaging",
      "Full export documentation: COO, packing list, invoice, lab report",
    ],
    image: "/local/finishing-goods.jpg",
    alt: "Finished leather goods packed and ready for despatch",
  },
]

const FINISHES = [
  {
    badge: "Most Natural",
    title: "Aniline",
    body: "Pure dye penetration with no pigment surface coat. The grain remains fully visible — soft, luminous, and characterful.",
    image: "/leather-fullgrain.jpg",
    alt: "Aniline finished full-grain leather",
  },
  {
    badge: "Balanced",
    title: "Semi-Aniline",
    body: "A light protective pigment coat over an aniline base. Greater consistency and durability while preserving the grain.",
    image: "/leather-topgrain.jpg",
    alt: "Semi-aniline top-grain leather finish",
  },
  {
    badge: "Character",
    title: "Pull-Up",
    body: "Oil and wax saturated leather that lightens beautifully when stretched — warm tones that develop with use.",
    image: "/hero-leather-tan.jpg",
    alt: "Pull-up oiled leather showing tonal variation",
  },
  {
    badge: "Soft Touch",
    title: "Nubuck",
    body: "Top-grain surface gently buffed to raise a fine, velvet-like nap. Refined hand-feel with full hide integrity intact.",
    image: "/leather-nubuck.jpg",
    alt: "Nubuck leather with a fine brushed nap",
  },
]

const FAQS = [
  {
    q: "How do I know the bulk shipment will match the sample I approved?",
    a: "Every bulk batch is colour-matched and hand-feel-matched against your retained master swatch before it is released. Lab data and photographs are kept on file per batch and provided with the shipment documentation.",
  },
  {
    q: "Is your leather REACH compliant for the European market?",
    a: "Yes. All chemistry used in our partner tanneries is REACH-compliant, with documented restrictions on AZO dyes, chromium VI, and other regulated substances. Lab certificates are available per batch on request.",
  },
  {
    q: "What grading system do you use, and is it conservative?",
    a: "We use a documented A / B / C grading system based on grain quality, scar density, and usable area. We grade conservatively — the leather you receive is at or above the grade declared on your documentation.",
  },
  {
    q: "What happens if a batch fails your internal QC?",
    a: "The batch does not advance. It is either reworked at the tannery, regraded into a lower category, or rejected entirely. We never substitute leather without your written approval.",
  },
  {
    q: "Can I commission a third-party inspection (SGS / Bureau Veritas) before shipment?",
    a: "Absolutely. We welcome third-party pre-shipment inspections at your cost and will coordinate access, sampling, and documentation directly with the inspection agency.",
  },
  {
    q: "What does “full-grain” and “top-grain” really mean in your terminology?",
    a: "Full-grain leather retains the entire natural grain surface — nothing sanded away. Top-grain has had a very fine top layer corrected for uniformity but the grain pattern itself is preserved. We never market split, bonded, or heavily corrected leather as either.",
  },
]

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function QualityContent() {
  return (
    <>
      <QualityHero />
      <AtAGlance />
      <TaglineMeaning />
      <Certifications />
      <Pillars />
      <ProcessStages />
      <FinishingMastery />
      <QualityFaq />
      <QualityCta />
    </>
  )
}

/**
 * The shared PolicyHero, same as Return Policy / Contact / Privacy / Terms.
 * The three QC facts ride in the trust-chip row rather than as a separate stats
 * band, which is what keeps this hero identical in height and rhythm to the
 * other four.
 */
function QualityHero() {
  return (
    <PolicyHero
      eyebrow="Quality & Process"
      title="Quality Without Compromise"
      subtitle="From raw material selection to final inspection, every stage of our supply chain is governed by rigorous, internationally benchmarked standards."
      trust={HERO_TRUST}
      actions={
        <>
          <Link href="#process" className="btn-brass group w-full sm:w-auto">
            Explore the Process
            <ArrowRight
              size={16}
              className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/sample-request"
            className="inline-flex w-full items-center justify-center rounded-none border border-leather-foreground/45 px-8 py-4 text-sm font-medium uppercase tracking-wide text-leather-foreground transition-colors duration-300 hover:bg-leather-foreground hover:text-leather focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-leather sm:w-auto"
          >
            Request Samples
          </Link>
        </>
      }
    />
  )
}

function AtAGlance() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="At a Glance" title="What quality means here" />
            <Stagger className="mt-8 space-y-3">
              {AT_A_GLANCE.map((item) => (
                <StaggerItem key={item}>
                  <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brass-ink" strokeWidth={2} />
                    {item}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
            {GLANCE_CARDS.map((card) => (
              <StaggerItem key={card.title}>
                <div className="flex h-full gap-4 border border-border bg-card p-6 shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-brass/35 text-brass-ink">
                    <card.icon size={20} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-foreground">{card.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}

function TaglineMeaning() {
  return (
    <section className="section-padding relative overflow-hidden bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
      <div aria-hidden="true" className="texture-grain absolute inset-0" />
      <div className="container-wide relative">
        <SectionHeading
          align="center"
          eyebrow="Our Promise"
          title="Where Grain Meets Greatness"
          lede="Our tagline is not a slogan — it is a working philosophy. Every hide we ship sits at the meeting point of nature's grain and the master finisher's craft."
          onDark
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3 lg:gap-8">
          {TAGLINE_PARTS.map((part) => (
            <StaggerItem key={part.title} className="h-full">
              <div className="flex h-full flex-col border border-primary-foreground/15 p-7 transition-colors duration-300 hover:border-brass/45 hover:bg-primary-foreground/5 dark:border-border dark:hover:bg-muted/30 lg:p-8">
                <span className="flex h-12 w-12 items-center justify-center border border-brass/35 text-brass">
                  <part.icon size={22} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-serif text-xl font-medium">{part.title}</h3>
                <p className="mt-2 text-sm font-medium text-brass">{part.lede}</p>
                <p className="mt-4 text-sm leading-relaxed text-primary-foreground/65 dark:text-muted-foreground">
                  {part.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function Certifications() {
  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Certified Excellence"
              title="Independently audited, not self-declared"
              lede="Our operations are certified to internationally recognised standards covering quality management, environmental responsibility, and ethical manufacturing across every facility we work with."
            />

            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
              {CERTIFICATIONS.map((cert) => (
                <StaggerItem key={cert.code}>
                  <div className="flex h-full items-start gap-3.5 border border-border bg-background p-5 transition-colors duration-300 hover:border-brass/50">
                    <Award size={18} className="mt-0.5 shrink-0 text-brass-ink" strokeWidth={1.6} />
                    <div>
                      <p className="font-serif text-base font-medium text-foreground">{cert.code}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cert.label}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <Reveal y={20} delay={0.15}>
            <figure className="overflow-hidden border border-border shadow-card">
              <img
                src="/luxury-leather-craftsmanship-workshop-artisan.jpg"
                alt="A leatherworker checking the finish and construction of a finished piece"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="border-t border-border bg-background p-4 text-xs text-muted-foreground">
                Final surface review and finishing quality checks.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Pillars() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          align="center"
          eyebrow="Our Quality Pillars"
          title="Four foundations under every hide"
          lede="These underpin every hide and finished good we ship to international buyers."
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <StaggerItem key={p.title} className="h-full">
              <div className="flex h-full flex-col border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brass/50 hover:shadow-card-hover">
                <span className="flex h-12 w-12 items-center justify-center border border-border text-brass-ink">
                  <p.icon size={22} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-serif text-lg font-medium text-foreground">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/** Six stages with a scroll-drawn connector, matching the landing page process. */
function ProcessStages() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 70%"] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 })

  return (
    <section id="process" className="section-padding scroll-mt-24 bg-bone relative">
      <div className="container-wide">
        <SectionHeading
          eyebrow="How We Ensure Quality"
          title="Six controlled stages"
          lede="Each stage is governed by documented procedures, signed off by a designated quality controller, and verified in our laboratory before the batch advances."
        />

        <div ref={ref} className="relative mt-14">
          {/* Connector rail. Sits behind the stage markers on lg+, and down the
              left gutter on smaller screens. */}
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-7 top-10 hidden w-px bg-border sm:block lg:left-1/2 lg:-translate-x-1/2"
          >
            <motion.div
              className="h-full w-full origin-top bg-brass"
              style={{ scaleY: reduce ? 1 : progress }}
            />
          </div>

          <div className="space-y-12 lg:space-y-16">
            {STAGES.map((stage, i) => (
              <div
                key={stage.n}
                className="relative grid items-center gap-6 sm:pl-20 lg:grid-cols-2 lg:gap-14 lg:pl-0"
              >
                {/* Stage marker on the rail */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 z-10 hidden h-14 w-14 items-center justify-center border border-border bg-background font-serif text-xl font-semibold text-leather shadow-card dark:text-tan sm:flex lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
                >
                  {stage.n}
                </span>

                <Reveal y={20} className={i % 2 === 1 ? "lg:order-2 lg:pl-14" : "lg:pr-14"}>
                  <figure className="overflow-hidden border border-border shadow-card">
                    <img
                      src={stage.image}
                      alt={stage.alt}
                      className="aspect-[3/2] w-full object-cover"
                      loading="lazy"
                    />
                  </figure>
                </Reveal>

                <Reveal
                  y={20}
                  delay={0.1}
                  className={i % 2 === 1 ? "lg:order-1 lg:pr-14 lg:text-right" : "lg:pl-14"}
                >
                  <p
                    className={`flex items-center gap-2.5 text-eyebrow ${
                      i % 2 === 1 ? "lg:justify-end" : ""
                    }`}
                  >
                    <stage.icon size={15} strokeWidth={1.8} className="shrink-0" />
                    {/* Number and label share one flex item so they flow as a
                        single run of text — as separate items they wrapped onto
                        two lines on narrow screens. */}
                    <span>
                      <span className="sm:hidden">Stage {stage.n} · </span>
                      {stage.kicker}
                    </span>
                  </p>
                  <h3 className="heading-subsection mt-3 text-foreground">{stage.title}</h3>
                  <div className={`divider-brass mt-5 ${i % 2 === 1 ? "lg:ml-auto" : ""}`} />
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground">{stage.body}</p>

                  <ul className="mt-6 space-y-2.5">
                    {stage.points.map((point) => (
                      <li
                        key={point}
                        className={`flex items-start gap-3 text-sm text-foreground/90 ${
                          i % 2 === 1 ? "lg:flex-row-reverse lg:text-right" : ""
                        }`}
                      >
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 text-brass-ink"
                          strokeWidth={2}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FinishingMastery() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Finishing Mastery"
          title="Finishes that reveal the grain"
          lede="Each finish is built up by hand-trained finishers using techniques refined over generations — chosen to reveal the grain, not replace it."
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FINISHES.map((f) => (
            <StaggerItem key={f.title} className="h-full">
              <div className="group flex h-full flex-col overflow-hidden border border-border bg-card shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={f.image}
                    alt={f.alt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 border border-brass/50 bg-leather/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brass backdrop-blur-sm">
                    {f.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-lg font-medium text-foreground">{f.title}</h3>
                  <div className="divider-brass mt-3" />
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-3xl border-l-2 border-brass bg-bone p-6 font-serif text-lg font-medium leading-relaxed text-foreground md:text-xl">
            The finish is where craft becomes visible. It is also where shortcuts become visible —
            and we don&apos;t take them.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function QualityFaq() {
  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <SectionHeading
          align="center"
          eyebrow="Quality — In Your Words"
          title="What buyers ask us most"
          lede="The questions international wholesale buyers raise most often about our quality process."
        />

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-border border-y border-border">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.04}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium text-foreground transition-colors hover:text-brass-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="relative h-4 w-4 shrink-0 text-brass-ink before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:-translate-y-1/2 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-300 group-open:after:rotate-90 group-open:after:opacity-0"
                  />
                </summary>
                <p className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function QualityCta() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-background py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, hsl(var(--leather)) 0%, transparent 45%), radial-gradient(circle at 75% 70%, hsl(var(--accent)) 0%, transparent 50%)",
        }}
      />
      <div aria-hidden="true" className="rule-brass-fade absolute inset-x-0 top-0 h-px" />
      <div className="container-wide relative">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-eyebrow">Next Step</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="heading-display mt-4 text-balance text-foreground">
              Ready to judge the quality yourself?
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              Request samples and assess the grain, finish and hand-feel in your own workshop — no
              commitment required.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/sample-request" className="btn-brass">
                <ClipboardCheck size={16} className="mr-2" />
                Request Free Samples
              </Link>
              <Link href="/catalog" className="btn-secondary">
                View Catalog
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-brass-ink" />
                Lab report included with every batch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Fingerprint size={13} className="text-brass-ink" />
                Full traceability documentation
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
