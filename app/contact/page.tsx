"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, MapPin, Phone, Clock, Loader2, Instagram, AlertCircle, CheckCircle2, X } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

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

      {/* Hero */}
      <section className="pt-32 pb-16 bg-bone dark:bg-background">
        <div className="container-wide">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-label text-brass mb-4"
          >
            Get in Touch
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="heading-display text-foreground mb-6"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl"
          >
            Ready to discuss your leather requirements? Our team is here to help you find the perfect materials for your projects.
          </motion.p>
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
                <div className="flex gap-4">
                  <MapPin size={20} className="text-brass flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Head Office</h4>
                    <p className="text-sm text-muted-foreground">
                      Kothi Mian Bashir Ahmed
                      <br />
                      Toheed Park, Daroghawala
                      <br />
                      Lahore, Punjab
                      <br />
                      Pakistan
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail size={20} className="text-brass flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Email</h4>
                    <p className="text-sm text-muted-foreground">
                      General Inquiries:{" "}
                      <a
                        href="mailto:info@puregrain.com"
                        className="text-leather hover:text-brass transition-colors"
                      >
                        info@puregrain.com
                      </a>
                      <br />
                      Sales & Orders:{" "}
                      <a
                        href="mailto:trade@puregrain.com"
                        className="text-leather hover:text-brass transition-colors"
                      >
                        sales@puregrain.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone size={20} className="text-brass flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Phone</h4>
                    <p className="text-sm text-muted-foreground">
                      Main:{" "}
                      <a
                        href="tel:+921234567890"
                        className="text-leather hover:text-brass transition-colors"
                      >
                        +92 308 4578957
                      </a>
                      <br />
                      International:{" "}
                      <a
                        href="tel:+12025550123"
                        className="text-leather hover:text-brass transition-colors"
                      >
                        +1 (202) 555-0123
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock size={20} className="text-brass flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Business Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 9:00 AM - 6:00 PM IST
                      <br />
                      Saturday: 9:00 AM - 1:00 PM IST
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Instagram size={20} className="text-brass flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Instagram</h4>
                    <a
                      href="http://instagram.com/puregrainexports/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-leather hover:text-brass transition-colors break-all"
                    >
                      instagram.com/puregrainexports
                    </a>
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