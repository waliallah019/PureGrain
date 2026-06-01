import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import PolicyContent from "./PolicyContent";
import "./policy.css";
import "./overrides.css";

export const metadata: Metadata = {
  title: "Return & Dispute Policy | Pure Grain Exports",
  description:
    "Pure Grain Exports return & dispute policy — how quality claims, refunds, and resolutions work for sample hides and wholesale leather orders.",
};

// Read the original body markup at build time. The styles in policy.css are
// already scoped under `.policyPage`, so they cannot leak to the rest of the site.
const html = fs.readFileSync(
  path.join(process.cwd(), "app/return-policy/policy-body.html"),
  "utf8"
);

export default function ReturnPolicyPage() {
  return (
    <>
      {/* Font Awesome 6 icons used inside the policy markup */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <Header />
      <main className="bg-background">
        <PolicyContent html={html} />
      </main>
      <Footer />
    </>
  );
}
