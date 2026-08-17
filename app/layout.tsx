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
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo"

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

/*
 * `metadataBase` is what makes every relative `alternates.canonical` and
 * `openGraph.images` entry resolve to an absolute URL. Without it Next emits
 * relative OG URLs, which most social crawlers reject — and canonical tags
 * cannot be emitted relatively at all.
 *
 * The title template gives every page "<Page> | Pure Grain Exports" while
 * `default` covers the homepage. The old homepage title was 74 characters and
 * truncated in SERPs; `default` below is 49.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pure Grain Exports — Premium B2B Leather Wholesale",
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "leather hides wholesale",
    "B2B leather supplier",
    "leather exporter Pakistan",
    "full grain leather wholesale",
    "finished leather goods wholesale",
    "bulk leather supplier",
  ],
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
    languages: { en: "/", "x-default": "/" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: "Pure Grain Exports — Premium B2B Leather Wholesale",
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Full-grain leather hide supplied by Pure Grain Exports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pure Grain Exports — Premium B2B Leather Wholesale",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/favicon-modified.png",
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