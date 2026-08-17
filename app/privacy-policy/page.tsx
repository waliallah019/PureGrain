
import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import '../return-policy/policy.css';
import './overrides.css';
import PolicyContent from './PolicyContent';
import PageEffects from './PageEffects';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

/*
 * DUPLICATE ROUTE. This is a legacy copy of the privacy policy: nothing on the
 * site links to it, it is not in the sitemap, but it was marked `index, follow`
 * — so it could be discovered and compete with `/privacy` (the version the
 * footer links to) for the same query. Two indexable pages on one topic split
 * ranking signals.
 *
 * It is now noindex with a canonical pointing at `/privacy`, which consolidates
 * any signals it has accumulated onto the live page without deleting anything.
 * Safe to delete this route outright once you have confirmed nothing external
 * links to it.
 */
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Pure Grain Exports collects, uses and protects personal and business data from our global B2B leather trade partners.',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
};

const html = fs.readFileSync(path.join(process.cwd(), 'app/privacy-policy/policy-body.html'), 'utf8');

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="policyPage">
        <PolicyContent html={html} />
      </main>
      <PageEffects />
      <Footer />
    </>
  );
}
