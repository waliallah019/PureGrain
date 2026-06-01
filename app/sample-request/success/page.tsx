import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function SampleRequestSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center py-16 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <div className="text-center p-8 bg-card rounded-lg shadow-xl max-w-md w-full">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Sample Request Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your sample request. We have received it and will begin processing it shortly.
            A confirmation email has been sent to your inbox.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
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
