"use client";

import { useId } from "react";
import {
  useCurrency,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
} from "@/lib/currency/CurrencyContext";

interface CurrencySwitcherProps {
  className?: string;
  /** When true, the select expands to fill its container (mobile menu). */
  fullWidth?: boolean;
  /**
   * Set while the header is transparent over the homepage hero. The control
   * then paints itself against dark photography instead of the page
   * background, which is the one case the theme tokens cannot infer.
   */
  onDark?: boolean;
}

export default function CurrencySwitcher({
  className,
  fullWidth = false,
  onDark = false,
}: CurrencySwitcherProps) {
  const { currency, setCurrency, isLoading } = useCurrency();
  const selectId = useId();

  return (
    <label
      htmlFor={selectId}
      className={`pg-currency-switcher inline-flex items-center gap-2 ${
        onDark ? "is-on-dark" : ""
      } ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
    >
      <i
        className="fa-solid fa-globe pg-currency-switcher__icon"
        aria-hidden="true"
      />
      <span className="sr-only">Select currency</span>
      <select
        id={selectId}
        aria-label="Select currency"
        disabled={isLoading}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className={`pg-currency-switcher__select ${fullWidth ? "w-full" : ""}`}
      >
        {SUPPORTED_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code} — {CURRENCY_NAMES[code]} ({CURRENCY_SYMBOLS[code]})
          </option>
        ))}
      </select>

      {/* All colours come from the theme tokens. This block previously
          hardcoded #2c1810 / #c49a6c / #f5ecd9 with a duplicate `.dark`
          override, and referenced --font-inter, a variable that no longer
          exists — the font stack is --font-sans now. */}
      <style jsx>{`
        .pg-currency-switcher {
          font-family: var(--font-sans), "Jost", sans-serif;
          color: hsl(var(--foreground));
        }
        .pg-currency-switcher__icon {
          color: hsl(var(--brass));
          font-size: 14px;
        }
        .pg-currency-switcher__select {
          appearance: none;
          -webkit-appearance: none;
          background-color: transparent;
          border: 1px solid hsl(var(--brass) / 0.45);
          border-radius: var(--radius);
          padding: 6px 28px 6px 10px;
          font-size: 13px;
          font-weight: 500;
          color: inherit;
          line-height: 1.2;
          cursor: pointer;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%23C49A6C' d='M0 0l5 6 5-6z'/></svg>");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pg-currency-switcher__select:hover,
        .pg-currency-switcher__select:focus-visible {
          border-color: hsl(var(--brass));
          outline: none;
          box-shadow: 0 0 0 2px hsl(var(--brass) / 0.28);
        }
        .pg-currency-switcher__select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        /* The native dropdown list is painted by the OS, so it needs explicit
           surface colours or it inherits the page's transparent background. */
        .pg-currency-switcher__select option {
          background-color: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
        }
        /* Transparent header over hero photography. */
        .pg-currency-switcher.is-on-dark {
          color: hsl(var(--leather-foreground));
        }
        .pg-currency-switcher.is-on-dark .pg-currency-switcher__select {
          border-color: hsl(var(--leather-foreground) / 0.4);
        }
      `}</style>
    </label>
  );
}
