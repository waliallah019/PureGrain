import fs from "fs";
import path from "path";
import "../return-policy/policy.css";
import "./overrides.css";
import PolicyContent from "./PolicyContent";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PolicyHero } from "@/components/layout/policy-hero";
import { Scale, FileSignature, Landmark } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The contractual framework governing Pure Grain Exports' B2B leather hide supply, custom finishing and private-label manufacturing — payment, grading, delivery and dispute terms.",
  path: "/terms",
});

const html = fs.readFileSync(
  path.join(process.cwd(), "app/terms/policy-body.html"),
  "utf8"
);

export default function TermsPage() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <Header />
      {/* Rendered OUTSIDE <main className="policyPage"> on purpose: policy.css is
          scoped under .policyPage, so keeping the hero outside it guarantees the
          legacy stylesheet cannot restyle the shared component. The page's own
          `#terms-hero-section` block was removed from policy-body.html. */}
      <PolicyHero
        eyebrow="Legal"
        title="Terms & Conditions"
        subtitle="The contractual framework governing all engagements with Pure Grain Exports — our B2B leather hide supply, custom finishing, and private-label manufacturing services."
        updated="Last Reviewed: May 1, 2026"
        trust={[
          { icon: <FileSignature size={14} />, label: "Written Confirmation on Every Order" },
          { icon: <Landmark size={14} />, label: "LC & Bank Transfer Supported" },
          { icon: <Scale size={14} />, label: "ICC Arbitration Available" },
        ]}
      />
      <main className="policyPage">
        <PolicyContent html={html} />
      </main>
      <Footer />
    </>
  );
}
