// app/quality/page.tsx
import "../return-policy/policy.css";
import "./overrides.css";
import PolicyContent from "./PolicyContent";
import PageEffects from "./PageEffects";
import fs from "fs";
import path from "path";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Quality & Process | Pure Grain Exports",
  description:
    "Discover the rigorous quality standards, inspection processes, and manufacturing practices behind every Pure Grain Exports leather hide.",
  robots: "index, follow",
};

export default function QualityPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "app/quality/policy-body.html"),
    "utf8"
  );
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
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
      <PageEffects />
      <Footer />
    </>
  );
}
