// app/request-sample/pay/page.tsx
"use client";

import "./pay.css";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { countries } from "@/lib/config/shippingConfig";

// PayPal SDK is injected client-side; minimal types so we can call it.
declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

type ShippingQuote = {
  country: string;
  region: string;
  amount: number;
  currency: "USD";
  carriers: string[];
  estimatedDeliveryDays: { min: number; max: number };
  recognized: boolean;
};

type FormState = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  productId: string;
  productName: string;
  productTypeCategory: "" | "finished-product" | "raw-leather";
  sampleType: "raw-leather" | "finished-products" | "both";
  quantitySamples: string;
  materialPreference: string;
  finishType: string;
  colorPreferences: string;
  specificRequests: string;
};

const INITIAL_FORM: FormState = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  country: "",
  address: "",
  productId: "",
  productName: "",
  productTypeCategory: "",
  sampleType: "finished-products",
  quantitySamples: "1 sample",
  materialPreference: "",
  finishType: "",
  colorPreferences: "",
  specificRequests: "",
};

type SuccessPayload = {
  requestNumber: string;
  paypalTransactionId: string;
  amount: number;
  currency: string;
};

function PayPageInner() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productImage, setProductImage] = useState<string>("");
  const [productLoading, setProductLoading] = useState(false);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoadError, setPaypalLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const paypalButtonsInstance = useRef<any>(null);
  // Always read latest form/quote from inside PayPal callbacks
  const formRef = useRef(form);
  const quoteRef = useRef(quote);
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { quoteRef.current = quote; }, [quote]);

  // ---------- Prefill from query params ----------
  useEffect(() => {
    const productId = searchParams.get("productId") || "";
    const productTypeCategory =
      (searchParams.get("productTypeCategory") as FormState["productTypeCategory"]) || "";

    if (!productId || !productTypeCategory) return;

    setForm((prev) => ({
      ...prev,
      productId,
      productTypeCategory,
      sampleType: productTypeCategory === "raw-leather" ? "raw-leather" : "finished-products",
    }));

    const apiBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || "/api";
    const endpoint =
      productTypeCategory === "raw-leather"
        ? `${apiBase}/raw-leather/${productId}`
        : `${apiBase}/finished-products/${productId}`;

    setProductLoading(true);
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((res) => {
        const p = res?.data;
        if (!p) return;
        const name: string = p.name || "";
        const material: string =
          (productTypeCategory === "raw-leather" ? p.leatherType : p.materialUsed) || "";
        const finish: string = p.finish || "";
        const colorList: string[] = Array.isArray(p.colorVariants)
          ? p.colorVariants
          : Array.isArray(p.colors)
            ? p.colors
            : [];
        const image: string =
          (Array.isArray(p.images) && p.images[0]) ||
          p.imageUrl ||
          p.heroImage ||
          "";
        setProductImage(image);
        setForm((prev) => ({
          ...prev,
          productName: name,
          materialPreference: material,
          finishType: finish,
          colorPreferences: colorList[0] || prev.colorPreferences,
          specificRequests:
            prev.specificRequests ||
            `Sample request for: ${name} (${productTypeCategory === "raw-leather" ? "Leather Hide" : "Finished Product"})`,
        }));
      })
      .catch(() => {
        // Fail-soft — keep form usable even if product can't be hydrated
      })
      .finally(() => setProductLoading(false));
  }, [searchParams]);

  // ---------- Shipping fee from server ----------
  useEffect(() => {
    const country = form.country;
    if (!country) {
      setQuote(null);
      return;
    }
    let active = true;
    setQuoteLoading(true);
    fetch(`/api/shipping-fee?country=${encodeURIComponent(country)}`)
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        if (res.success) setQuote(res.data as ShippingQuote);
        else setQuote(null);
      })
      .catch(() => active && setQuote(null))
      .finally(() => active && setQuoteLoading(false));
    return () => {
      active = false;
    };
  }, [form.country]);

  // ---------- Validation ----------
  const validateForm = useCallback((f: FormState): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!f.companyName.trim()) next.companyName = "Company name is required.";
    if (!f.contactPerson.trim()) next.contactPerson = "Contact person is required.";
    if (!f.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) next.email = "Enter a valid email.";
    if (!f.country) next.country = "Please select your country.";
    if (!f.address.trim() || f.address.trim().length < 10)
      next.address = "Please provide a complete shipping address.";
    return next;
  }, []);

  const formErrors = useMemo(() => validateForm(form), [form, validateForm]);
  const isFormValid = Object.keys(formErrors).length === 0 && !!quote;

  const handleField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const copy = { ...prev };
      delete copy[key as string];
      return copy;
    });
  };

  const handleBlur = (key: keyof FormState) => () => {
    setErrors(validateForm({ ...form }));
  };

  // ---------- Load PayPal SDK ----------
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setPaypalLoadError("Payment is temporarily unavailable. Please try again shortly.");
      return;
    }
    if (typeof window === "undefined") return;
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-pg-paypal-sdk="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setPaypalReady(true));
      existing.addEventListener("error", () =>
        setPaypalLoadError("Could not load PayPal. Please refresh the page.")
      );
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      PAYPAL_CLIENT_ID
    )}&currency=USD&intent=capture&components=buttons&disable-funding=credit,paylater`;
    script.async = true;
    script.dataset.pgPaypalSdk = "true";
    script.onload = () => setPaypalReady(true);
    script.onerror = () =>
      setPaypalLoadError("Could not load PayPal. Please refresh the page.");
    document.body.appendChild(script);
  }, []);

  // ---------- Render PayPal buttons whenever they are mountable ----------
  useEffect(() => {
    if (success) return;
    if (!paypalReady || !window.paypal || !paypalContainerRef.current) return;
    if (!isFormValid) return;

    // Tear down any previous instance before re-rendering
    try { paypalButtonsInstance.current?.close?.(); } catch { /* noop */ }
    paypalContainerRef.current.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 44 },
      onInit: (_data: any, actions: any) => {
        // Disable until form is valid (re-checked at click too)
        if (!isFormValid) actions.disable();
      },
      onClick: (_data: any, actions: any) => {
        const errs = validateForm(formRef.current);
        if (Object.keys(errs).length > 0 || !quoteRef.current) {
          setErrors(errs);
          setGlobalError("Please complete the required fields before paying.");
          return actions.reject();
        }
        setGlobalError(null);
        return actions.resolve();
      },
      createOrder: async () => {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: formRef.current.country,
            productName: formRef.current.productName || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.data?.orderId) {
          const extra = json?.code === "PAYEE_ACCOUNT_RESTRICTED"
            ? "Your PayPal merchant account is currently restricted or not fully enabled for Checkout in this environment."
            : undefined;
          throw new Error(extra || json?.message || "Could not start payment.");
        }
        return json.data.orderId as string;
      },
      onApprove: async (data: { orderID: string }) => {
        setSubmitting(true);
        setGlobalError(null);
        try {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderID,
              form: {
                companyName: formRef.current.companyName.trim(),
                contactPerson: formRef.current.contactPerson.trim(),
                email: formRef.current.email.trim(),
                phone: formRef.current.phone.trim(),
                country: formRef.current.country,
                address: formRef.current.address.trim(),
                productId: formRef.current.productId || "",
                productName: formRef.current.productName || "",
                productTypeCategory: formRef.current.productTypeCategory || undefined,
                sampleType: formRef.current.sampleType,
                quantitySamples: formRef.current.quantitySamples,
                materialPreference: formRef.current.materialPreference,
                finishType: formRef.current.finishType,
                colorPreferences: formRef.current.colorPreferences,
                specificRequests: formRef.current.specificRequests,
              },
            }),
          });
          const json = await res.json();
          if (!res.ok || !json?.success) {
            throw new Error(json?.message || "Payment was received but we could not save your request. Our team has been notified.");
          }
          setSuccess({
            requestNumber: json.data.requestNumber,
            paypalTransactionId: json.data.paypalTransactionId,
            amount: json.data.amount,
            currency: json.data.currency || "USD",
          });
        } catch (err: any) {
          setGlobalError(err?.message || "Something went wrong while finalising your order.");
        } finally {
          setSubmitting(false);
        }
      },
      onError: (err: any) => {
        // eslint-disable-next-line no-console
        console.error("[paypal] onError", err);
        setGlobalError("PayPal reported an error. Please try again or use a different payment method.");
        setSubmitting(false);
      },
      onCancel: () => {
        setGlobalError(null);
        setSubmitting(false);
      },
    });

    paypalButtonsInstance.current = buttons;
    buttons.render(paypalContainerRef.current).catch((err: any) => {
      // eslint-disable-next-line no-console
      console.error("[paypal] render failed", err);
      setPaypalLoadError("Could not display the PayPal button. Please refresh.");
    });

    return () => {
      try { buttons.close?.(); } catch { /* noop */ }
    };
    // We intentionally re-render the buttons when form validity OR quote changes.
  }, [paypalReady, isFormValid, success, quote, validateForm]);

  // ---------- Render ----------
  return (
    <div className="pgPayPage">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      />
      <Header />

      <main>
        {/* HERO */}
        <section className="pgHero">
          <div className="pgContainer">
            <div className="pgHero__frame">
              <p className="pgHero__eyebrow">Sample Request · Secure Checkout</p>
              <h1 className="pgHero__title">Receive a Free Leather Sample</h1>
              <p className="pgHero__subtitle">
                Evaluate the grain, weight, and finish of our hides in your own atelier.
                Pay only the international courier fee — the sample itself is on us.
              </p>
            </div>
          </div>
        </section>

        {/* TRANSPARENCY BANNER */}
        <section className="pgContainer">
          <div className="sample-transparency-banner" role="region" aria-label="Free sample policy">
            <div className="sample-transparency-banner__left">
              <i className="fa-solid fa-gift sample-transparency-banner__icon" aria-hidden="true" />
              <div>
                <h2 className="sample-transparency-banner__title">Your Sample is Completely Free</h2>
                <p className="sample-transparency-banner__text">
                  Pure Grain Exports covers the full cost of your leather sample — no product
                  charge, no handling fee, no minimums. The only cost is international courier
                  shipping to your door, calculated transparently below based on your location.
                  This is standard practice in the global leather trade and ensures your sample
                  arrives safely and trackably via DHL or FedEx.
                </p>
              </div>
            </div>
            <div className="sample-transparency-banner__pills">
              <span className="sample-transparency-banner__pill">
                <i className="fa-solid fa-box-open" aria-hidden="true" /> Sample: FREE
              </span>
              <span className="sample-transparency-banner__pill">
                <i className="fa-solid fa-truck" aria-hidden="true" /> Shipping: Calculated by region
              </span>
              <span className="sample-transparency-banner__pill">
                <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Payment: Secured by PayPal
              </span>
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="pgSection">
          <div className="pgContainer">
            <div className="pgSection__head">
              <h2 className="pgSection__title">How Your Sample Reaches You</h2>
              <p className="pgSection__sub">
                Every sample order follows a simple, trackable process from our facility to your door.
              </p>
            </div>
            <ol className="sample-shipping-timeline">
              {[
                {
                  icon: "fa-clipboard-check",
                  label: "Request Confirmed",
                  desc: "Your form and payment are received. Our team reviews your request within 1 business day.",
                },
                {
                  icon: "fa-boxes-stacked",
                  label: "Sample Prepared",
                  desc: "Your leather sample is hand-selected, graded, and packaged to prevent transit damage.",
                },
                {
                  icon: "fa-plane-departure",
                  label: "Shipped via DHL / FedEx",
                  desc: "Dispatched within 2–3 business days of confirmation. You receive a tracking number by email.",
                },
                {
                  icon: "fa-house-circle-check",
                  label: "Delivered to Your Door",
                  desc: "Typical delivery: 5–10 business days depending on your region. Fully trackable end-to-end.",
                },
              ].map((s) => (
                <li key={s.label} className="pgStep">
                  <span className="pgStep__icon" aria-hidden="true">
                    <i className={`fa-solid ${s.icon}`} />
                  </span>
                  <div>
                    <p className="pgStep__label">{s.label}</p>
                    <p className="pgStep__desc">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="pgCustomsNote">
              All samples are shipped with commercial invoice and customs documentation
              included. If your shipment is held at customs, our team will provide the
              necessary paperwork to assist clearance — at no additional cost.
            </p>
          </div>
        </section>

        {/* FORM + PAY */}
        <section className="pgSection" style={{ paddingTop: 0 }}>
          <div className="pgContainer">
            {success ? (
              <div className="pgSuccess" role="status">
                <div className="pgSuccess__icon" aria-hidden="true">
                  <i className="fa-solid fa-check" />
                </div>
                <h2 className="pgSuccess__title">Payment Received</h2>
                <p className="pgSuccess__sub">
                  Thank you. Your sample request has been submitted and our team will be in
                  touch within one business day with dispatch details.
                </p>
                <p className="pgSuccess__ref">
                  Reference: <strong>{success.requestNumber}</strong>
                </p>
                <p className="pgSuccess__ref" style={{ marginLeft: 8 }}>
                  Transaction: <strong>{success.paypalTransactionId}</strong>
                </p>
                <div>
                  <Link href="/catalog" className="pgSuccess__cta">Back to Catalog</Link>
                </div>
              </div>
            ) : (
              <div className="pgFlowGrid">
                {/* LEFT — form */}
                <div className="pgCard">
                  <div className="pgCard__head">
                    <h2 className="pgCard__title">Sample Request Details</h2>
                    <p className="pgCard__sub">
                      Required fields are marked with an asterisk. We use these only to ship
                      and follow up on your sample.
                    </p>
                  </div>
                  <div className="pgCard__body">
                    {form.productName && (
                      <div className="pgProduct">
                        {productImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={productImage} alt={form.productName} className="pgProduct__img" />
                        ) : (
                          <div className="pgProduct__img" aria-hidden="true" />
                        )}
                        <div className="pgProduct__meta">
                          <span className="pgProduct__label">Selected product</span>
                          <span className="pgProduct__name">{form.productName}</span>
                          <span className="pgProduct__sub">
                            {form.productTypeCategory === "raw-leather"
                              ? "Leather Hide"
                              : "Finished Product"}
                            {form.materialPreference ? ` · ${form.materialPreference}` : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pgGrid2">
                      <div className="pgField">
                        <label className="pgLabel" htmlFor="companyName">
                          Company Name<span className="req">*</span>
                        </label>
                        <input
                          id="companyName"
                          className="pgInput"
                          value={form.companyName}
                          onChange={handleField("companyName")}
                          onBlur={handleBlur("companyName")}
                          autoComplete="organization"
                        />
                        {errors.companyName && <p className="pgError">{errors.companyName}</p>}
                      </div>
                      <div className="pgField">
                        <label className="pgLabel" htmlFor="contactPerson">
                          Contact Person<span className="req">*</span>
                        </label>
                        <input
                          id="contactPerson"
                          className="pgInput"
                          value={form.contactPerson}
                          onChange={handleField("contactPerson")}
                          onBlur={handleBlur("contactPerson")}
                          autoComplete="name"
                        />
                        {errors.contactPerson && <p className="pgError">{errors.contactPerson}</p>}
                      </div>
                    </div>

                    <div className="pgGrid2">
                      <div className="pgField">
                        <label className="pgLabel" htmlFor="email">
                          Email<span className="req">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="pgInput"
                          value={form.email}
                          onChange={handleField("email")}
                          onBlur={handleBlur("email")}
                          autoComplete="email"
                        />
                        {errors.email && <p className="pgError">{errors.email}</p>}
                      </div>
                      <div className="pgField">
                        <label className="pgLabel" htmlFor="phone">Phone Number</label>
                        <input
                          id="phone"
                          className="pgInput"
                          value={form.phone}
                          onChange={handleField("phone")}
                          autoComplete="tel"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="pgField">
                      <label className="pgLabel" htmlFor="country">
                        Country<span className="req">*</span>
                      </label>
                      <select
                        id="country"
                        className="pgSelect"
                        value={form.country}
                        onChange={handleField("country")}
                        onBlur={handleBlur("country")}
                      >
                        <option value="">Select a country…</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.country && <p className="pgError">{errors.country}</p>}
                      <p className="pgFieldHint">
                        Shipping fee is calculated transparently from your selected country.
                      </p>
                    </div>

                    <div className="pgField">
                      <label className="pgLabel" htmlFor="address">
                        Full Shipping Address<span className="req">*</span>
                      </label>
                      <textarea
                        id="address"
                        className="pgTextarea"
                        value={form.address}
                        onChange={handleField("address")}
                        onBlur={handleBlur("address")}
                        rows={3}
                        placeholder="Street, building, city, state / region, postal code"
                      />
                      {errors.address && <p className="pgError">{errors.address}</p>}
                    </div>

                    <div className="pgField">
                      <label className="pgLabel" htmlFor="specificRequests">
                        Notes for our team
                      </label>
                      <textarea
                        id="specificRequests"
                        className="pgTextarea"
                        value={form.specificRequests}
                        onChange={handleField("specificRequests")}
                        rows={3}
                        placeholder="Tell us about colour, thickness, intended use, or any specific grade you'd like to evaluate."
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT — fee + paypal */}
                <aside className="pgCard" aria-label="Shipping fee and payment">
                  <div className="pgCard__head">
                    <h2 className="pgCard__title">Order Summary</h2>
                    <p className="pgCard__sub">
                      <span className="pgFreeStrip">
                        <i className="fa-solid fa-gift" /> Sample Free
                      </span>
                    </p>
                  </div>
                  <div className="pgCard__body">
                    <div className="pgFeeCard__row">
                      <span>Leather sample{form.productName ? ` — ${form.productName}` : ""}</span>
                      <strong>FREE</strong>
                    </div>
                    <div className="pgFeeCard__row pgFeeCard__row--muted">
                      <span>Quantity</span>
                      <span>{form.quantitySamples}</span>
                    </div>

                    {!form.country ? (
                      <div className="pgFeeCard__placeholder" style={{ marginTop: 14 }}>
                        Select your country to calculate the courier shipping fee.
                      </div>
                    ) : quoteLoading ? (
                      <div className="pgFeeCard__placeholder" style={{ marginTop: 14 }}>
                        <span className="pgInlineSpinner" /> Calculating shipping…
                      </div>
                    ) : quote ? (
                      <>
                        <div className="pgFeeCard__row" style={{ marginTop: 10 }}>
                          <span>International shipping ({quote.region})</span>
                          <strong>${quote.amount.toFixed(2)} {quote.currency}</strong>
                        </div>
                        <div className="pgFeeCard__row pgFeeCard__row--muted">
                          <span>Carriers</span>
                          <span>{quote.carriers.join(" / ")}</span>
                        </div>
                        <div className="pgFeeCard__row pgFeeCard__row--muted">
                          <span>Estimated delivery</span>
                          <span>
                            {quote.estimatedDeliveryDays.min}–{quote.estimatedDeliveryDays.max} business days
                          </span>
                        </div>
                        <div className="pgFeeCard__row pgFeeCard__row--total">
                          <span>Total due today</span>
                          <span className="pgFeeCard__total-amount">
                            ${quote.amount.toFixed(2)} {quote.currency}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="pgFeeCard__placeholder" style={{ marginTop: 14 }}>
                        We couldn’t fetch a shipping quote. Please try another country or contact us.
                      </div>
                    )}

                    {/* PayPal area */}
                    {paypalLoadError ? (
                      <div className="pgPayBox pgPayBox--locked">{paypalLoadError}</div>
                    ) : !isFormValid ? (
                      <div className="pgPayBox pgPayBox--locked">
                        <i className="fa-solid fa-lock" aria-hidden="true" />{" "}
                        Complete the form on the left to enable secure payment.
                      </div>
                    ) : (
                      <div className="pgPayBox">
                        {submitting && (
                          <p style={{ fontSize: 13, color: "var(--text-mute)", margin: "0 0 10px" }}>
                            <span className="pgInlineSpinner" /> Finalising your order…
                          </p>
                        )}
                        <div ref={paypalContainerRef} className="pgPaypalContainer" />
                        {!paypalReady && !paypalLoadError && (
                          <p style={{ fontSize: 13, color: "var(--text-mute)", margin: "8px 0 0" }}>
                            <span className="pgInlineSpinner" /> Loading secure checkout…
                          </p>
                        )}
                      </div>
                    )}

                    {globalError && (
                      <p className="pgError" style={{ marginTop: 10 }}>{globalError}</p>
                    )}

                    <ul className="pgTrustList">
                      <li><i className="fa-solid fa-shield-halved" /> Secure payment powered by PayPal</li>
                      <li><i className="fa-solid fa-user-shield" /> We do not store your payment details</li>
                      <li><i className="fa-solid fa-truck-fast" /> Shipment fee only — samples are free</li>
                    </ul>

                    {productLoading && (
                      <p style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 10 }}>
                        Loading product details…
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>

        {/* POLICY GRID */}
        <section className="pgSection" style={{ paddingTop: 10 }}>
          <div className="pgContainer">
            <div className="pgSection__head">
              <h2 className="pgSection__title">What You Should Know</h2>
              <p className="pgSection__sub">
                A short, plain-English summary of how our sample programme works.
              </p>
            </div>

            <div className="pgPolicyGrid">
              <article className="pgPolicyCard">
                <span className="pgPolicyCard__icon" aria-hidden="true">
                  <i className="fa-solid fa-gift" />
                </span>
                <h3 className="pgPolicyCard__title">Free Sample Policy</h3>
                <p className="pgPolicyCard__body">
                  Samples are provided free of cost to qualified buyers. The shipping fee is
                  charged only to ensure serious enquiries and to cover international courier
                  costs. For confirmed wholesale orders, the sample shipping fee can be
                  credited back against your first invoice.
                </p>
              </article>

              <article className="pgPolicyCard">
                <span className="pgPolicyCard__icon" aria-hidden="true">
                  <i className="fa-solid fa-truck-fast" />
                </span>
                <h3 className="pgPolicyCard__title">Sample Shipping &amp; Delivery</h3>
                <div className="pgPolicyCard__body">
                  <ul>
                    <li>Dispatch time: <strong>2–4 business days</strong></li>
                    <li>USA &amp; UK delivery: <strong>5–7 days</strong></li>
                    <li>Europe delivery: <strong>5–8 days</strong></li>
                    <li>Shipping partners: <strong>DHL, FedEx, UPS</strong></li>
                    <li>Tracking number provided after dispatch</li>
                  </ul>
                </div>
              </article>

              <article className="pgPolicyCard">
                <span className="pgPolicyCard__icon" aria-hidden="true">
                  <i className="fa-solid fa-shield-halved" />
                </span>
                <h3 className="pgPolicyCard__title">Payment Transparency</h3>
                <p className="pgPolicyCard__body">
                  Payment is processed securely by PayPal — we never see or store your card
                  details. The amount you pay is exactly the courier fee shown above, in USD.
                  Wholesale orders are handled separately via Letter of Credit (LC); PayPal is
                  used only for sample shipping.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="pgPayPage">
          <div className="pgContainer" style={{ padding: "120px 28px", textAlign: "center" }}>
            <span className="pgInlineSpinner" /> Preparing secure checkout…
          </div>
        </div>
      }
    >
      <PayPageInner />
    </Suspense>
  );
}
