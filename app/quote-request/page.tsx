// my-leather-platform/app/quote-request/page.tsx
// This file can now be a Server Component if you want, or remain a Client Component.
// For simplicity, let's keep it a client component since your header/footer are likely client too.
"use client";

import { Suspense } from 'react'; // <-- Only Suspense here
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageBanner } from "@/components/layout/page-banner";
import { QuoteRequestFormContent } from './QuoteRequestFormContent'; // <-- Import the new component
import { Loader2 } from 'lucide-react'; // For the fallback UI

export default function QuoteRequestPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
    
      {/* Wrap the component that uses useSearchParams with Suspense */}
      <Suspense fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-xl text-muted-foreground">
          <Loader2 className="animate-spin h-8 w-8 mb-3 text-amber-500" />
          <p>Loading Quote Request Form...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing pre-fill data</p>
        </div>
      }>
        <QuoteRequestFormContent /> {/* Render the component here */}
      </Suspense>
      <Footer />
    </div>
  );
}