import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Without these, `font-sans` (set on <body>) and every `font-serif` class
      // resolved to Tailwind's default system stacks and beat the base-layer
      // font-family rules on specificity — body copy rendered in system-ui and
      // `font-serif` rendered in Georgia while <h1>/<h2> rendered Cormorant.
      // Pointing both keys at the next/font variables makes one font system.
      fontFamily: {
        sans: ["var(--font-sans)", "Jost", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        brass: {
          DEFAULT: "hsl(var(--brass))",
          foreground: "hsl(var(--brass-foreground))",
        },
        // Text-safe brass. `brass` at 51% lightness only reaches ~2.5:1 on the
        // cream background, so every brass eyebrow/label on a light surface was
        // failing WCAG AA. `brass-ink` flips per theme (deep antique brass on
        // light, bright brass on dark) and clears 4.5:1 in both. Rule of thumb:
        // brass for fills/borders/dark surfaces, brass-ink for text on the page
        // background.
        "brass-ink": "hsl(var(--brass-ink))",
        leather: {
          DEFAULT: "hsl(var(--leather))",
          foreground: "hsl(var(--leather-foreground))",
        },
        tan: {
          DEFAULT: "hsl(var(--tan))",
          foreground: "hsl(var(--tan-foreground))",
        },
        bone: {
          DEFAULT: "hsl(var(--bone))",
          foreground: "hsl(var(--bone-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // `.card-industrial` already applied `shadow-card` / `shadow-card-hover`,
      // but neither key existed — Tailwind resolved them as shadow *colour*
      // utilities off the `card` palette entry, so the cards rendered with no
      // elevation at all. These are the intended warm-brown elevations.
      boxShadow: {
        card: "0 1px 2px hsl(var(--shadow-color) / 0.06), 0 4px 16px -6px hsl(var(--shadow-color) / 0.12)",
        "card-hover":
          "0 2px 4px hsl(var(--shadow-color) / 0.08), 0 16px 32px -12px hsl(var(--shadow-color) / 0.22)",
        elevated:
          "0 4px 8px hsl(var(--shadow-color) / 0.10), 0 24px 48px -16px hsl(var(--shadow-color) / 0.28)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "kenburns": {
          "0%": { transform: "scale(1.06) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.16) translate3d(0,-1.5%,0)" },
        },
        "sheen": {
          "0%": { transform: "translateX(-120%) skewX(-18deg)" },
          "100%": { transform: "translateX(220%) skewX(-18deg)" },
        },
        "orbit-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.25)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        kenburns: "kenburns 12s ease-out forwards",
        sheen: "sheen 1.1s ease-out",
        "orbit-pulse": "orbit-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
