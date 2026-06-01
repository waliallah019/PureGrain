"use client";

import { useCurrency } from "@/lib/currency/CurrencyContext";

interface PriceDisplayProps {
  usdAmount: number;
  className?: string;
  showOriginal?: boolean;
}

export default function PriceDisplay({
  usdAmount,
  className,
  showOriginal = false,
}: PriceDisplayProps) {
  const { currency, format, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <span
        aria-busy="true"
        className={`inline-block align-middle h-[1em] w-20 rounded bg-neutral-200/80 dark:bg-neutral-700/60 animate-pulse ${className ?? ""}`}
      />
    );
  }

  const formattedUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(usdAmount) ? usdAmount : 0);

  return (
    <span className={`inline-flex flex-col leading-tight ${className ?? ""}`}>
      <span>{format(usdAmount)}</span>
      {showOriginal && currency !== "USD" && (
        <span className="text-[0.7em] text-muted-foreground mt-0.5">
          (USD {formattedUsd})
        </span>
      )}
    </span>
  );
}
