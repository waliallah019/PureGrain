"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, Plane, ClipboardCheck, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useSampleTrayStore } from "@/lib/stores/sampleTrayStore";

function SampleRequestSuccessInner() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const clearTray = useSampleTrayStore((s) => s.clearTray);

  // Clear the persisted tray on mount — the order is now safely stored.
  useEffect(() => {
    clearTray();
  }, [clearTray]);

  const steps = [
    { icon: ClipboardCheck, label: "We receive your order" },
    { icon: Package, label: "We pack your samples (1-2 days)" },
    { icon: Plane, label: "DHL collects and ships (day 2-3)" },
    { icon: HomeIcon, label: "Samples arrive at your door" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center py-16 bg-bone">
        <div className="text-center p-8 bg-card rounded-lg shadow-xl max-w-xl w-full">
          <CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-3">
            Sample Request Submitted!
          </h1>
          {ref && (
            <p className="text-sm text-muted-foreground mb-2">
              Order reference{" "}
              <strong className="text-foreground">{ref}</strong>
            </p>
          )}
          <p className="text-muted-foreground mb-8">
            Thank you for your sample request. We have received it and will
            begin processing it shortly. A confirmation email has been sent to
            your inbox.
          </p>

          <div className="text-left mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-brass mb-3">
              What happens next
            </p>
            <ol className="space-y-3">
              {steps.map((s, idx) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <s.icon className="h-4 w-4 text-leather" />
                  <span className="text-foreground">{s.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-brass hover:bg-brass/90 text-brass-foreground">
              <Link href="/catalog">Explore More Products</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SampleRequestSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SampleRequestSuccessInner />
    </Suspense>
  );
}
