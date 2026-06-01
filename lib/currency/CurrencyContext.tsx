"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export const SUPPORTED_CURRENCIES = [
  "USD", "GBP", "EUR", "PKR", "CAD", "AUD", "AED", "SAR",
  "ZAR", "NGN", "KES", "CNY", "JPY", "INR", "TRY", "BRL",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  PKR: "₨",
  CAD: "CA$",
  AUD: "A$",
  AED: "د.إ",
  SAR: "﷼",
  ZAR: "R",
  NGN: "₦",
  KES: "KSh",
  CNY: "¥",
  JPY: "¥",
  INR: "₹",
  TRY: "₺",
  BRL: "R$",
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  GBP: "British Pound",
  EUR: "Euro",
  PKR: "Pakistani Rupee",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  ZAR: "South African Rand",
  NGN: "Nigerian Naira",
  KES: "Kenyan Shilling",
  CNY: "Chinese Yuan",
  JPY: "Japanese Yen",
  INR: "Indian Rupee",
  TRY: "Turkish Lira",
  BRL: "Brazilian Real",
};

const STORAGE_KEY = "pg_currency";

interface CurrencyContextValue {
  currency: string;
  symbol: string;
  rates: Record<string, number>;
  convert: (usdAmount: number) => number;
  format: (usdAmount: number) => string;
  setCurrency: (code: string) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function safeGetStored(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSetStored(value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

function isSupported(code: string | null | undefined): code is CurrencyCode {
  return !!code && (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = safeGetStored();
      let resolvedCurrency = "USD";

      if (isSupported(stored)) {
        resolvedCurrency = stored;
      } else {
        try {
          const res = await fetch("/api/detect-currency", { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as { currency?: string };
            if (isSupported(data.currency)) {
              resolvedCurrency = data.currency;
            }
          }
        } catch {
          /* fall back to USD */
        }
      }

      try {
        const res = await fetch("/api/exchange-rates");
        if (res.ok) {
          const data = (await res.json()) as { rates?: Record<string, number> };
          if (data?.rates && typeof data.rates === "object") {
            if (!cancelled) setRates({ ...data.rates, USD: 1 });
          }
        }
      } catch {
        /* keep default rates {USD:1}; convert() will fall back gracefully */
      }

      if (!cancelled) {
        setCurrencyState(resolvedCurrency);
        setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    const next = isSupported(code) ? code : "USD";
    setCurrencyState(next);
    safeSetStored(next);
  }, []);

  const convert = useCallback(
    (usdAmount: number) => {
      if (!Number.isFinite(usdAmount)) return 0;
      const rate = rates[currency];
      const safeRate = typeof rate === "number" && rate > 0 ? rate : 1;
      return Math.round(usdAmount * safeRate * 100) / 100;
    },
    [rates, currency]
  );

  const format = useCallback(
    (usdAmount: number) => {
      const converted = convert(usdAmount);
      const code = isSupported(currency) ? currency : "USD";
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(converted);
      } catch {
        const symbol = CURRENCY_SYMBOLS[code] || "$";
        return `${symbol}${converted.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })}`;
      }
    },
    [convert, currency]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      symbol: CURRENCY_SYMBOLS[currency] || "$",
      rates,
      convert,
      format,
      setCurrency,
      isLoading,
    }),
    [currency, rates, convert, format, setCurrency, isLoading]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
