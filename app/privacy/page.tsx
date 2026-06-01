/* app/privacy/page.tsx */
"use client"

import { motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-bone dark:bg-background">
        <div className="container-wide">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-label text-brass mb-4"
            >
              Legal
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="heading-display text-foreground mb-6"
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              Last updated: January 1, 2026
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-3xl space-y-10 text-body text-muted-foreground">
            {/* 1. Information We Collect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-section text-foreground mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including name, email address, company name, phone number, and any other information you choose to provide when contacting us or requesting samples.
              </p>
            </motion.div>

            {/* 2. How We Use Your Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="heading-section text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Respond to your inquiries and provide customer service</li>
                <li>Process sample requests and orders</li>
                <li>Send you technical information about our products and services</li>
                <li>Communicate about promotions, upcoming events, and industry news</li>
                <li>Improve our products and services</li>
              </ul>
            </motion.div>

            {/* 3. Information Sharing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="heading-section text-foreground mb-4">3. Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
              </p>
            </motion.div>

            {/* 4. Data Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="heading-section text-foreground mb-4">4. Data Security</h2>
              <p>
                We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights.
              </p>
            </motion.div>

            {/* 5. Your Rights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="heading-section text-foreground mb-4">5. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information at any time. To exercise these rights, please contact us at{" "}
                <a href="mailto:info@puregrainexports.com" className="text-brass underline">
                  info@puregrainexports.com
                </a>.
              </p>
            </motion.div>

            {/* 6. Contact Us */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="heading-section text-foreground mb-4">6. Contact Us</h2>
              <p className="mb-2">If you have any questions about this Privacy Policy, please contact us at:</p>
              <p className="mb-1">
                <span className="text-foreground">Email:</span>{" "}
                <a href="mailto:info@puregrainexports.com" className="text-brass underline">
                  info@puregrainexports.com
                </a>
              </p>
              <p>
                <span className="text-foreground">Address:</span> Kothi Mian Bashir Ahmed Toheed Park, Daroghawala, Lahore 54000, Pakistan
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}