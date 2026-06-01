// app/payments-and-trade-terms/page.tsx
import "../return-policy/policy.css";
import "./overrides.css";
import PolicyContent from "./PolicyContent";
import PageEffects from "./PageEffects";
import fs from "fs";
import path from "path";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PaymentsAndTradeTermsPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "app/payments-and-trade-terms/policy-body.html"),
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
        integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <div className="policyPage">
        <Header />
        <main>
          <PolicyContent html={html} />
        </main>
      </div>

      <PageEffects /> {/* 👈 add this — renders nothing visible, just runs effects */}
      <Footer />
    </>
  );
}