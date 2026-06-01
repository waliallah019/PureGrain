import type React from "react"
import type { Metadata } from "next"
import { Jost, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactLenis } from "@/lib/utils/lenis"
import { FloatingSamplesSticker } from "@/components/layout/floating-samples-sticker"
import { ScrollManager } from "@/components/layout/scroll-to-top-on-route-change"
import WhatsAppButton from "@/components/WhatsAppButton"
import { CurrencyProvider } from "@/lib/currency/CurrencyContext"

const inter = Jost({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: "Pure Grain - Premium B2B Leather Wholesale | Where Grain meets Greatness",
  description:
    "Premium B2B leather wholesale platform. Source quality leather hides and finished leather products, for international wholesale and retail distribution.",
  keywords:
    "leather wholesale, B2B leather, leather hides, finished leather products, international leather supplier",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon-modified.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ReactLenis root>
        <body
          className={`${inter.variable} ${playfair.variable} font-sans`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={true}
          >
            <CurrencyProvider>
              <ScrollManager />
              {children}
              <FloatingSamplesSticker />
              <WhatsAppButton
                phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""}
                prefillMessage="Hi Pure Grain, I'd like to know more about your leather products."
                showPulse
                bottomOffset={24}
              />
            </CurrencyProvider>
          </ThemeProvider>
        </body>
      </ReactLenis>
    </html>
  )
}