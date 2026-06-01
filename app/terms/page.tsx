import fs from "fs";
import path from "path";
import "../return-policy/policy.css";
import "./overrides.css";
import PolicyContent from "./PolicyContent";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terms & Conditions | Pure Grain Exports",
  description:
    "Pure Grain Exports terms & conditions — the contractual framework governing our B2B leather hide exports, private-label manufacturing, and trade engagements.",
  robots: "index, follow",
};

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
      <main className="policyPage">
        <PolicyContent html={html} />
      </main>
      <Footer />
    </>
  );
}
