import type React from "react"
import type { Metadata } from "next"
import { Jost, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactLenis } from "@/lib/utils/lenis"
import { FloatingSamplesSticker } from "@/components/layout/floating-samples-sticker"
import { ScrollManager } from "@/components/layout/scroll-to-top-on-route-change"
import WhatsAppButton from "@/components/WhatsAppButton"
import SampleTrayBar from "@/components/sample-request/SampleTrayBar"
import { CurrencyProvider } from "@/lib/currency/CurrencyContext"

// These are self-hosted by next/font. globals.css used to ALSO pull the same two
// families from the Google Fonts CDN via @import, so every visitor downloaded
// both faces twice; that import is gone. The CSS variables are consumed by
// `fontFamily.sans` / `fontFamily.serif` in tailwind.config.ts, which is what
// makes `font-sans`/`font-serif` (and the base body/heading rules) resolve to
// the brand faces instead of the system stack.
const fontSans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})
const fontSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
})

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

// fast-refresh probe
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ReactLenis root>
        <body
          className={`${fontSans.variable} ${fontSerif.variable} font-sans`}
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
              {/* Offsets left at their defaults — this sits in the bottom-right
                  corner and the Free Samples sticker sits in the bottom-left, so
                  neither needs to clear the other. */}
              <WhatsAppButton
                phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""}
                prefillMessage="Hi Pure Grain, I'd like to know more about your leather products."
                showPulse
              />
              {/* Global sample-tray bar — surfaces the persisted hide tray on
                  every customer page. Self-hides on the checkout flow and
                  admin area via useSampleTrayVisible(). */}
              <SampleTrayBar />
            </CurrencyProvider>
          </ThemeProvider>
        </body>
      </ReactLenis>
    </html>
  )
}