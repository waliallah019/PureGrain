"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Loader2,
  Instagram,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  MessageCircle,
  Ship,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Reveal, Stagger, StaggerItem } from "@/components/landing/primitives"
import { PolicyHero } from "@/components/layout/policy-hero"
import {
  SITE,
  SITE_ADDRESS_ONE_LINE,
  SITE_MAP_EMBED_URL,
  SITE_MAP_LINK_URL,
} from "@/lib/site"

type ContactFormData = {
  fullName: string
  companyName: string
  email: string
  phone: string
  country: string
  industry: string
  inquiryType: string
  message: string
}

const initialFormData: ContactFormData = {
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
  country: "",
  industry: "",
  inquiryType: "",
  message: "",
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle")
  const [submitMessage, setSubmitMessage] = useState("")

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (submitState !== "idle") {
      setSubmitState("idle")
      setSubmitMessage("")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitState("idle")
    setSubmitMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          industry: formData.industry,
          inquiryType: formData.inquiryType,
          message: formData.message,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        const errorText = payload?.message || "Unable to submit your inquiry right now. Please try again."
        setSubmitState("error")
        setSubmitMessage(errorText)
        return
      }

      setSubmitState("success")
      setSubmitMessage(payload.message || "Inquiry submitted successfully.")
      setFormData(initialFormData)
    } catch {
      setSubmitState("error")
      setSubmitMessage("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Shared policy-style hero (see components/layout/policy-hero.tsx) —
          the same dark leather-texture treatment as Return Policy, Privacy and
          Terms, so the site's non-catalogue pages open consistently. */}
      <PolicyHero
        eyebrow="Get in Touch"
        title="Talk to the people who ship the leather"
        subtitle="Tell us what you are producing and we will match it to the right hide, finish and quantity. Enquiries are answered by our Lahore office, usually within one business day."
        trust={[
          { icon: <MapPin size={14} />, label: `${SITE.address.city}, ${SITE.address.country}` },
          {
            icon: <Clock size={14} />,
            label: `Office hours in ${SITE.timezone.abbr} (${SITE.timezone.utcOffset})`,
          },
          { icon: <MessageCircle size={14} />, label: SITE.whatsappNote },
        ]}
      />

      {/* Direct channels immediately under the hero — a contact page should let
          someone reach you without hunting for a number. */}
      <section className="border-b border-border bg-bone">
        <div className="container-wide py-8">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a href={`mailto:${SITE.email}`} className="btn-brass w-full sm:w-auto">
              <Mail size={16} className="mr-2 shrink-0" />
              <span className="truncate">{SITE.email}</span>
            </a>
            <a href={`tel:${SITE.phoneHref}`} className="btn-secondary w-full sm:w-auto">
              <Phone size={16} className="mr-2 shrink-0" />
              {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
            {/* Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="heading-subsection text-foreground mb-6">Send an Inquiry</h2>
                <div className="divider-brass mb-8" />
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                    <input
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Company Name *</label>
                    <input
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass"
                      placeholder="Your company"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Country *</label>
                    <input
                      name="country"
                      type="text"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass"
                      placeholder="Your country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Industry *</label>
                  <select
                    name="industry"
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border bg-background text-foreground focus:outline-none focus:border-brass"
                  >
                    <option value="">Select your industry</option>
                    <option value="footwear">Footwear</option>
                    <option value="furniture">Furniture & Interiors</option>
                    <option value="automotive">Automotive & Marine</option>
                    <option value="bags">Bags & Luggage</option>
                    <option value="accessories">Accessories</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Inquiry Type *</label>
                  <select
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border bg-background text-foreground focus:outline-none focus:border-brass"
                  >
                    <option value="">Select inquiry type</option>
                    <option value="sample">Request Samples</option>
                    <option value="quote">Request Quote</option>
                    <option value="custom">Custom Specifications</option>
                    <option value="general">General Inquiry</option>
                    <option value="partnership">Partnership Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    minLength={10}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass resize-none"
                    placeholder="Tell us about your requirements, including leather types, quantities, and specifications..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="btn-primary w-full md:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <motion.span
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        Sending inquiry...
                      </motion.span>
                    </>
                  ) : (
                    "Submit Inquiry"
                  )}
                </button>
              </motion.form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="heading-subsection text-foreground mb-6">Contact Information</h2>
                <div className="divider-brass mb-8" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Every value below comes from lib/site.ts. Previously this
                    block was hand-typed and had drifted from the footer — wrong
                    email domain, a tel: link that dialled a placeholder, and a
                    reserved fictional US number. */}
                <div className="flex gap-4">
                  <MapPin size={20} className="mt-1 flex-shrink-0 text-brass-ink" />
                  <div>
                    <h4 className="mb-1 font-medium text-foreground">Head Office</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {SITE.address.line1}
                      <br />
                      {SITE.address.line2}
                      <br />
                      {SITE.address.city} {SITE.address.postalCode}, {SITE.address.region}
                      <br />
                      {SITE.address.country}
                    </p>
                    <a
                      href={SITE_MAP_LINK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brass-ink transition-colors hover:text-brass"
                    >
                      Open in Maps
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail size={20} className="mt-1 flex-shrink-0 text-brass-ink" />
                  <div>
                    <h4 className="mb-1 font-medium text-foreground">Email</h4>
                    <a
                      href={`mailto:${SITE.email}`}
                      className="break-all text-sm text-leather transition-colors hover:text-brass-ink dark:text-tan"
                    >
                      {SITE.email}
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone size={20} className="mt-1 flex-shrink-0 text-brass-ink" />
                  <div>
                    <h4 className="mb-1 font-medium text-foreground">Phone</h4>
                    <a
                      href={`tel:${SITE.phoneHref}`}
                      className="text-sm text-leather transition-colors hover:text-brass-ink dark:text-tan"
                    >
                      {SITE.phoneDisplay}
                    </a>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MessageCircle size={12} className="text-brass-ink" />
                      {SITE.whatsappNote}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock size={20} className="mt-1 flex-shrink-0 text-brass-ink" />
                  <div>
                    <h4 className="mb-1 font-medium text-foreground">
                      Business Hours{" "}
                      <span className="font-normal text-muted-foreground">
                        ({SITE.timezone.abbr}, {SITE.timezone.utcOffset})
                      </span>
                    </h4>
                    <dl className="space-y-0.5 text-sm text-muted-foreground">
                      {SITE.hours.map((h) => (
                        <div key={h.days} className="flex justify-between gap-4">
                          <dt>{h.days}</dt>
                          <dd className="text-foreground/80">{h.time}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Instagram size={20} className="mt-1 flex-shrink-0 text-brass-ink" />
                  <div>
                    <h4 className="mb-1 font-medium text-foreground">Social</h4>
                    <div className="flex flex-col gap-1 text-sm">
                      <a
                        href={SITE.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-leather transition-colors hover:text-brass-ink dark:text-tan"
                      >
                        Instagram
                      </a>
                      <a
                        href={SITE.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-leather transition-colors hover:text-brass-ink dark:text-tan"
                      >
                        LinkedIn
                      </a>
                      <a
                        href={SITE.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-leather transition-colors hover:text-brass-ink dark:text-tan"
                      >
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-8 p-6 bg-bone border border-border dark:bg-muted/30"
              >
                <h4 className="font-serif text-lg font-medium text-foreground mb-2">Response Time</h4>
                <p className="text-sm text-muted-foreground">
                  We typically respond to all inquiries within 24 business hours. For urgent requirements, please call our sales team directly.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Where we are — real embedded map of the head office plus the sourcing
          footprint. The map is the genuine article (Google Maps embed of the
          actual address), which is more useful to a buyer than a stock photo. */}
      <section className="section-padding bg-bone">
        <div className="container-wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <Reveal>
                <p className="text-eyebrow">Where We Are</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="heading-section mt-4 text-foreground">
                  Lahore head office, nationwide sourcing
                </h2>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="divider-brass mt-6" />
              </Reveal>
              <Reveal delay={0.22}>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  Commercial and export operations run from Lahore. The material itself comes from
                  Pakistan&apos;s established leather clusters, which is why we can hold consistent
                  quality across large orders rather than depending on a single tannery.
                </p>
              </Reveal>

              <Stagger className="mt-8 space-y-3">
                {SITE.sourcingRegions.map((region) => (
                  <StaggerItem key={region.city}>
                    <div className="flex items-start gap-4 border border-border bg-background p-4 transition-colors duration-300 hover:border-brass/50">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-brass/35 text-brass-ink">
                        <Ship size={16} strokeWidth={1.6} />
                      </span>
                      <div>
                        <h3 className="font-serif text-lg font-medium text-foreground">
                          {region.city}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{region.note}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            <Reveal y={0} delay={0.1} className="lg:pt-2">
              <div className="overflow-hidden border border-border bg-card shadow-card">
                <iframe
                  src={SITE_MAP_EMBED_URL}
                  title={`Map showing ${SITE.name} at ${SITE_ADDRESS_ONE_LINE}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="h-[320px] w-full border-0 md:h-[420px] lg:h-[480px]"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                  <p className="text-sm text-muted-foreground">{SITE_ADDRESS_ONE_LINE}</p>
                  <Link
                    href={SITE_MAP_LINK_URL}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brass-ink transition-colors hover:text-brass"
                  >
                    Directions
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {submitState !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-feedback-title"
          aria-describedby="contact-feedback-message"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-7 ${submitState === "success" ? "border-emerald-200 bg-white text-foreground dark:border-emerald-900 dark:bg-slate-950" : "border-red-200 bg-white text-foreground dark:border-red-900 dark:bg-slate-950"}`}
          >
            <button
              type="button"
              onClick={() => setSubmitState("idle")}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 pr-10">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${submitState === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                {submitState === "success" ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>

              <div className="min-w-0 flex-1">
                <p id="contact-feedback-title" className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Contact Form
                </p>
                <h3 className="mt-2 text-2xl font-semibold leading-tight">
                  {submitState === "success" ? "Submission Successful" : "Submission Failed"}
                </h3>
                <p id="contact-feedback-message" className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  {submitMessage}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSubmitState("idle")}
                className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${submitState === "success" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700"}`}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  )
}