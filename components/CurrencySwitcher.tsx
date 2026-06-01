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
}

export default function CurrencySwitcher({
  className,
  fullWidth = false,
}: CurrencySwitcherProps) {
  const { currency, setCurrency, isLoading } = useCurrency();
  const selectId = useId();

  return (
    <label
      htmlFor={selectId}
      className={`pg-currency-switcher inline-flex items-center gap-2 ${
        fullWidth ? "w-full" : ""
      } ${className ?? ""}`}
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

      <style jsx>{`
        .pg-currency-switcher {
          font-family: var(--font-inter), "Jost", sans-serif;
          color: #2c1810;
        }
        .pg-currency-switcher__icon {
          color: #c49a6c;
          font-size: 14px;
        }
        .pg-currency-switcher__select {
          appearance: none;
          -webkit-appearance: none;
          background-color: transparent;
          border: 1px solid rgba(196, 154, 108, 0.45);
          border-radius: 6px;
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
        .pg-currency-switcher__select:focus {
          border-color: #c49a6c;
          outline: none;
          box-shadow: 0 0 0 2px rgba(196, 154, 108, 0.25);
        }
        .pg-currency-switcher__select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        :global(.dark) .pg-currency-switcher {
          color: #f5ecd9;
        }
        :global(.dark) .pg-currency-switcher__select {
          color: #f5ecd9;
          border-color: rgba(196, 154, 108, 0.5);
        }
        :global(.dark) .pg-currency-switcher__select option {
          background-color: #2c1810;
          color: #f5ecd9;
        }
      `}</style>
    </label>
  );
}
