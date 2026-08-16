/**
 * Canonical company facts.
 *
 * These were previously re-typed in the footer, the contact page and the About
 * page HTML, and had drifted badly: the contact page advertised
 * `info@puregrain.com` (wrong domain), labelled a "Sales & Orders" address as
 * `sales@puregrain.com` while the mailto: pointed at `trade@puregrain.com`,
 * displayed `+92 308 4578957` behind a `tel:+921234567890` link that dialled a
 * placeholder, listed a reserved fictional US number (+1 202 555-0123), and
 * gave opening hours in IST — Indian Standard Time — for a Pakistani exporter.
 *
 * Anything customer-facing should import from here rather than hardcoding.
 */

export const SITE = {
  name: "Pure Grain Exports",
  shortName: "PureGrain",

  email: "info@puregrainexports.com",
  phoneDisplay: "+92 324 5243670",
  /** E.164, for tel: hrefs. Must stay in sync with phoneDisplay. */
  phoneHref: "+923245243670",
  whatsappNote: "WhatsApp available on the same number",

  address: {
    line1: "Kothi Mian Bashir Ahmed",
    line2: "Toheed Park, Daroghawala",
    city: "Lahore",
    region: "Punjab",
    postalCode: "54000",
    country: "Pakistan",
  },

  /**
   * Pakistan Standard Time (UTC+5). Deliberately spelled out — the site's
   * buyers are in Europe and North America and need the offset to work out
   * when someone is actually at a desk.
   */
  timezone: { abbr: "PKT", utcOffset: "UTC+5" },
  hours: [
    { days: "Monday – Friday", time: "9:00 AM – 6:00 PM" },
    { days: "Saturday", time: "9:00 AM – 1:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],

  social: {
    instagram: "https://instagram.com/puregrainexports/",
    facebook: "https://www.facebook.com/puregrainexports",
    linkedin: "https://www.linkedin.com/company/puregrainexports",
  },

  /**
   * Head office is Lahore; hides and finished goods come from the established
   * clusters. Kept here so the About and Contact pages tell the same story.
   */
  sourcingRegions: [
    { city: "Sialkot", note: "Finished leather goods and gloves" },
    { city: "Kasur", note: "Tanneries — hide processing and finishing" },
    { city: "Karachi", note: "Port, export handling and consolidation" },
  ],
} as const

export const SITE_ADDRESS_ONE_LINE = [
  SITE.address.line1,
  SITE.address.line2,
  `${SITE.address.city} ${SITE.address.postalCode}`,
  SITE.address.country,
].join(", ")

/** Google Maps embed works without an API key via the `output=embed` form. */
export const SITE_MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  SITE_ADDRESS_ONE_LINE
)}&output=embed`

export const SITE_MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SITE_ADDRESS_ONE_LINE
)}`
