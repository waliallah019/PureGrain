"use client";

/**
 * /sample-request/review
 * ----------------------
 * Unified review + checkout page that handles BOTH sample-request flows:
 *
 *   • HIDE             — items come from the persisted Zustand sample tray
 *                        (1–3 hides). Reachable via the SampleTrayBar.
 *   • FINISHED_PRODUCT — exactly 1 finished product, deep-linked from the
 *                        product detail page with `?productId=…&productTypeCategory=finished-product`.
 *
 * Payment uses the existing PayPal smart-button integration. Server-side
 * shipping rates come from the new `ShippingRate` collection, surfaced via
 * `/api/sample-request/shipping-rate`.
 *
 * This page is additive; the existing `/sample-request` and
 * `/request-sample/pay` routes are untouched and still work.
 */

import "./review.css";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import SampleTrayBar from "@/components/sample-request/SampleTrayBar";
import { useSampleTrayStore } from "@/lib/stores/sampleTrayStore";

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

const INDUSTRIES = [
  "Footwear",
  "Furniture & Interiors",
  "Automotive",
  "Bags & Luggage",
  "Gloves",
  "Sports Goods",
  "Fashion & Apparel",
  "Accessories",
  "Saddlery",
  "Other",
] as const;

// Country list — we re-export from the legacy shippingConfig for parity
// with the existing /request-sample/pay page so the dropdown matches.
import { countries as ALL_COUNTRIES } from "@/lib/config/shippingConfig";

interface ShippingLookup {
  found: boolean;
  data?: {
    country: string;
    region: string;
    dhlZone: string;
    rateUsd: number;
    transitDays: string;
  };
}

interface FinishedProductSummary {
  productId: string;
  productName: string;
  productType?: string;
  finish?: string;
  thickness?: string;
  image?: string;
}

interface FormState {
  fullName: string;
  companyName: string;
  email: string;
  country: string;
  industry: string;
  website: string;
  notes: string;
  phone: string;
  address: string;
}

const INITIAL_FORM: FormState = {
  fullName: "",
  companyName: "",
  email: "",
  country: "",
  industry: "",
  website: "",
  notes: "",
  phone: "",
  address: "",
};

function ReviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trayItems = useSampleTrayStore((s) => s.items);
  const removeHide = useSampleTrayStore((s) => s.removeHide);
  const clearTray = useSampleTrayStore((s) => s.clearTray);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // ---- Mode resolution ---------------------------------------------------
  const queryProductId = searchParams.get("productId") || "";
  const queryCategory = searchParams.get("productTypeCategory") || "";
  const queryType = searchParams.get("type") || "";

  const mode: "HIDE" | "FINISHED_PRODUCT" =
    queryCategory === "finished-product" || queryType === "FINISHED_PRODUCT"
      ? "FINISHED_PRODUCT"
      : "HIDE";

  // ---- Finished-product hydration ---------------------------------------
  const [finished, setFinished] = useState<FinishedProductSummary | null>(null);
  const [finishedLoading, setFinishedLoading] = useState(false);

  useEffect(() => {
    if (mode !== "FINISHED_PRODUCT" || !queryProductId) return;
    let active = true;
    setFinishedLoading(true);
    fetch(`/api/finished-products/${queryProductId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((res) => {
        if (!active) return;
        const p = res?.data;
        if (!p) return;
        setFinished({
          productId: String(p._id),
          productName: p.name || "Sample product",
          productType: p.productType,
          finish: p.finish,
          thickness: p.thickness,
          image:
            (Array.isArray(p.images) && p.images[0]) ||
            p.imageUrl ||
            p.heroImage ||
            "",
        });
      })
      .catch(() => {
        if (active) setFinished(null);
      })
      .finally(() => active && setFinishedLoading(false));
    return () => {
      active = false;
    };
  }, [mode, queryProductId]);

  // ---- Tray-empty redirect (HIDE mode) ----------------------------------
  useEffect(() => {
    if (!hydrated) return;
    if (mode !== "HIDE") return;
    if (trayItems.length === 0) {
      router.replace("/catalog/raw-leather?empty=1");
    }
  }, [hydrated, mode, trayItems.length, router]);

  // ---- Form -------------------------------------------------------------
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((f: FormState): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!f.fullName.trim()) next.fullName = "Full name is required.";
    if (!f.companyName.trim()) next.companyName = "Company name is required.";
    if (!f.email.trim()) next.email = "Business email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      next.email = "Enter a valid email.";
    if (!f.country) next.country = "Please select your country.";
    if (!f.industry) next.industry = "Please select your industry.";
    if (!f.address.trim() || f.address.trim().length < 10)
      next.address = "Please provide a complete shipping address.";
    if (f.notes && f.notes.length > 300)
      next.notes = "Notes are limited to 300 characters.";
    return next;
  }, []);

  const formErrors = useMemo(() => validate(form), [form, validate]);

  const handleField =
    (k: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setErrors((prev) => {
        if (!prev[k as string]) return prev;
        const c = { ...prev };
        delete c[k as string];
        return c;
      });
    };

  // ---- Shipping rate lookup ---------------------------------------------
  const [rate, setRate] = useState<ShippingLookup | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    if (!form.country) {
      setRate(null);
      return;
    }
    let active = true;
    setRateLoading(true);
    fetch(
      `/api/sample-request/shipping-rate?country=${encodeURIComponent(form.country)}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        if (res.success) setRate({ found: !!res.found, data: res.data });
        else setRate(null);
      })
      .catch(() => active && setRate(null))
      .finally(() => active && setRateLoading(false));
    return () => {
      active = false;
    };
  }, [form.country]);

  // ---- Items payload (for the API) --------------------------------------
  const items = useMemo(() => {
    if (mode === "HIDE") {
      return trayItems.map((t) => ({
        productId: t.productId,
        productName: t.productName,
        productType: "raw-leather",
        hideType: t.hideType,
        grade: t.grade,
        thickness: t.thickness,
        tanningMethod: t.tanningMethod,
        finish: t.finish,
      }));
    }
    if (finished) {
      return [
        {
          productId: finished.productId,
          productName: finished.productName,
          productType: "finished-product",
          finish: finished.finish,
          thickness: finished.thickness,
        },
      ];
    }
    return [];
  }, [mode, trayItems, finished]);

  const itemsValid =
    (mode === "HIDE" && items.length >= 1 && items.length <= 3) ||
    (mode === "FINISHED_PRODUCT" && items.length === 1);

  const isFormValid =
    Object.keys(formErrors).length === 0 && !!rate?.found && itemsValid;

  // ---- PayPal smart buttons ---------------------------------------------
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoadError, setPaypalLoadError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    requestNumber: string;
    orderRef?: string;
    paypalTransactionId: string;
    amount: number;
  } | null>(null);

  const paypalSlotRef = useRef<HTMLDivElement | null>(null);
  const paypalInstanceRef = useRef<any>(null);

  // Refs so PayPal callbacks always read the latest state.
  const formRef = useRef(form);
  const rateRef = useRef(rate);
  const itemsRef = useRef(items);
  const modeRef = useRef(mode);
  useEffect(() => {
    formRef.current = form;
  }, [form]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setPaypalLoadError("Payment is temporarily unavailable.");
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
        setPaypalLoadError("Could not load PayPal. Please refresh.")
      );
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      PAYPAL_CLIENT_ID
    )}&currency=USD&intent=capture&components=buttons&disable-funding=credit,paylater`;
    s.async = true;
    s.dataset.pgPaypalSdk = "true";
    s.onload = () => setPaypalReady(true);
    s.onerror = () =>
      setPaypalLoadError("Could not load PayPal. Please refresh.");
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (success) return;
    if (!paypalReady || !window.paypal || !paypalSlotRef.current) return;
    if (!isFormValid) return;

    try {
      paypalInstanceRef.current?.close?.();
    } catch {
      /* noop */
    }
    paypalSlotRef.current.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 44 },
      onClick: (_d: any, actions: any) => {
        const errs = validate(formRef.current);
        if (Object.keys(errs).length > 0 || !rateRef.current?.found) {
          setErrors(errs);
          setGlobalError("Please complete the required fields before paying.");
          return actions.reject();
        }
        setGlobalError(null);
        return actions.resolve();
      },
      createOrder: async () => {
        const r = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: formRef.current.country,
            requestType: modeRef.current,
            productName:
              modeRef.current === "FINISHED_PRODUCT"
                ? itemsRef.current[0]?.productName
                : "Leather sample tray",
          }),
        });
        const j = await r.json();
        if (!r.ok || !j?.data?.orderId) {
          throw new Error(j?.message || "Could not start payment.");
        }
        return j.data.orderId as string;
      },
      onApprove: async (data: { orderID: string }) => {
        setSubmitting(true);
        setGlobalError(null);
        try {
          const r = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderID,
              requestType: modeRef.current,
              items: itemsRef.current,
              industry: formRef.current.industry,
              website: formRef.current.website || undefined,
              notes: formRef.current.notes || undefined,
              form: {
                companyName: formRef.current.companyName.trim(),
                contactPerson: formRef.current.fullName.trim(),
                email: formRef.current.email.trim(),
                phone: formRef.current.phone.trim(),
                country: formRef.current.country,
                address: formRef.current.address.trim(),
                productId:
                  modeRef.current === "FINISHED_PRODUCT"
                    ? itemsRef.current[0]?.productId || ""
                    : "",
                productName:
                  modeRef.current === "FINISHED_PRODUCT"
                    ? itemsRef.current[0]?.productName
                    : itemsRef.current
                        .map((i: any) => i.productName)
                        .filter(Boolean)
                        .join(", "),
                productTypeCategory:
                  modeRef.current === "FINISHED_PRODUCT"
                    ? "finished-product"
                    : "raw-leather",
                sampleType:
                  modeRef.current === "HIDE"
                    ? "raw-leather"
                    : "finished-products",
                quantitySamples:
                  modeRef.current === "HIDE"
                    ? `${itemsRef.current.length} hide sample${itemsRef.current.length === 1 ? "" : "s"}`
                    : "1 sample unit",
                materialPreference: "",
                finishType: "",
                colorPreferences: "",
                specificRequests: formRef.current.notes || "",
              },
            }),
          });
          const j = await r.json();
          if (!r.ok || !j?.success) {
            throw new Error(
              j?.message ||
                "Payment was received but we could not save your request. Our team has been notified."
            );
          }
          setSuccess({
            requestNumber: j.data.requestNumber,
            orderRef: j.data.orderRef,
            paypalTransactionId: j.data.paypalTransactionId,
            amount: j.data.amount,
          });
          // Clear tray once the order is safely persisted.
          if (modeRef.current === "HIDE") clearTray();
        } catch (err: any) {
          setGlobalError(err?.message || "Something went wrong.");
        } finally {
          setSubmitting(false);
        }
      },
      onError: (err: any) => {
        // eslint-disable-next-line no-console
        console.error("[paypal/review] onError", err);
        setGlobalError("PayPal reported an error. Please try again.");
        setSubmitting(false);
      },
      onCancel: () => {
        setSubmitting(false);
      },
    });

    paypalInstanceRef.current = buttons;
    buttons.render(paypalSlotRef.current).catch((err: any) => {
      // eslint-disable-next-line no-console
      console.error("[paypal/review] render failed", err);
      setPaypalLoadError("Could not display the PayPal button.");
    });

    return () => {
      try {
        buttons.close?.();
      } catch {
        /* noop */
      }
    };
  }, [paypalReady, isFormValid, success, rate, validate, clearTray]);

  // ---- Success state -----------------------------------------------------
  if (success) {
    const ref = success.orderRef || success.requestNumber;
    return (
      <div className="reviewPage">
        <Header />
        <main>
          <section className="reviewBody">
            <div className="container-wide">
              <div className="reviewSuccess">
                <p className="reviewPill" style={{ marginBottom: 12 }}>
                  Order confirmed
                </p>
                <h1 className="reviewHero__title" style={{ marginBottom: 8 }}>
                  Thank you — your samples are on the way
                </h1>
                <p style={{ color: "hsl(var(--muted-foreground))" }}>
                  Reference <strong>{ref}</strong> — paid ${success.amount.toFixed(2)} USD
                </p>
                <div style={{ marginTop: 24 }}>
                  <Link href={`/sample-request/success?ref=${encodeURIComponent(ref)}`} className="btn-brass">
                    View Order Summary
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- Render ------------------------------------------------------------
  return (
    <div className="reviewPage">
      <Header />
      <main>
        <section className="reviewHero">
          <div className="container-wide">
            <p className="reviewHero__eyebrow">Sample Request · Review &amp; Checkout</p>
            <h1 className="reviewHero__title">Your Sample Selection</h1>
            <p className="reviewHero__sub">
              Confirm your selection and shipping details below. Samples are
              free of charge — you only cover international DHL Express
              shipping to your door.
            </p>
          </div>
        </section>

        <section className="reviewBody">
          <div className="container-wide">
            <div className="reviewGrid">
              {/* LEFT — selection */}
              <div>
                <h2 className="reviewCol__title">Your Sample Selection</h2>
                <p className="reviewCol__sub">
                  {mode === "HIDE"
                    ? "Up to three leather hide samples per request."
                    : "One finished product sample per request."}
                </p>

                {mode === "HIDE" && (
                  <>
                    <span className="reviewCounter">
                      {trayItems.length} of 3 hides selected
                    </span>
                    {trayItems.map((it) => (
                      <article key={it.productId} className="reviewCard">
                        <div
                          className="reviewCard__img"
                          style={
                            it.image
                              ? { backgroundImage: `url(${it.image})` }
                              : undefined
                          }
                          aria-hidden="true"
                        />
                        <div className="reviewCard__body">
                          <p className="reviewCard__name">{it.productName}</p>
                          <p className="reviewCard__meta">
                            {[it.hideType, it.grade, it.thickness, it.tanningMethod, it.finish]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <button
                            type="button"
                            className="reviewCard__remove"
                            onClick={() => removeHide(it.productId)}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </article>
                    ))}
                    {trayItems.length < 3 && (
                      <Link href="/catalog/raw-leather" className="reviewAddMore">
                        + Add another hide (optional)
                      </Link>
                    )}
                  </>
                )}

                {mode === "FINISHED_PRODUCT" && (
                  <>
                    {finishedLoading && <div className="reviewSkeleton" />}
                    {finished && (
                      <article className="reviewCard">
                        <div
                          className="reviewCard__img"
                          style={
                            finished.image
                              ? { backgroundImage: `url(${finished.image})` }
                              : undefined
                          }
                          aria-hidden="true"
                        />
                        <div className="reviewCard__body">
                          <p className="reviewCard__name">{finished.productName}</p>
                          <p className="reviewCard__meta">
                            {[finished.productType, finished.finish, finished.thickness]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p className="reviewPill" style={{ marginTop: 8 }}>
                            1 sample unit
                          </p>
                        </div>
                      </article>
                    )}
                    {!finished && !finishedLoading && (
                      <p style={{ color: "hsl(var(--muted-foreground))" }}>
                        We couldn&apos;t load the selected product.{" "}
                        <Link href="/catalog/finished-products" className="link-underline">
                          Go back to the catalog
                        </Link>
                        .
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT — form */}
              <div>
                <h2 className="reviewCol__title">Your Details</h2>
                <p className="reviewCol__sub">
                  We use this information only to ship your samples and follow
                  up on your enquiry.
                </p>

                <div className="reviewForm__row">
                  <div className="reviewField">
                    <label className="reviewLabel" htmlFor="fullName">
                      Full Name<span className="req">*</span>
                    </label>
                    <input
                      id="fullName"
                      className="reviewInput"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleField("fullName")}
                    />
                    {errors.fullName && (
                      <p className="reviewError">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="reviewField">
                    <label className="reviewLabel" htmlFor="companyName">
                      Company Name<span className="req">*</span>
                    </label>
                    <input
                      id="companyName"
                      className="reviewInput"
                      autoComplete="organization"
                      value={form.companyName}
                      onChange={handleField("companyName")}
                    />
                    {errors.companyName && (
                      <p className="reviewError">{errors.companyName}</p>
                    )}
                  </div>
                </div>

                <div className="reviewForm__row">
                  <div className="reviewField">
                    <label className="reviewLabel" htmlFor="email">
                      Business Email<span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="reviewInput"
                      value={form.email}
                      onChange={handleField("email")}
                    />
                    {errors.email && (
                      <p className="reviewError">{errors.email}</p>
                    )}
                  </div>
                  <div className="reviewField">
                    <label className="reviewLabel" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      autoComplete="tel"
                      className="reviewInput"
                      value={form.phone}
                      onChange={handleField("phone")}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="reviewForm__row">
                  <div className="reviewField">
                    <label className="reviewLabel" htmlFor="country">
                      Country<span className="req">*</span>
                    </label>
                    <select
                      id="country"
                      className="reviewSelect"
                      value={form.country}
                      onChange={handleField("country")}
                    >
                      <option value="">Select a country…</option>
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="reviewError">{errors.country}</p>
                    )}
                  </div>
                  <div className="reviewField">
                    <label className="reviewLabel" htmlFor="industry">
                      Industry<span className="req">*</span>
                    </label>
                    <select
                      id="industry"
                      className="reviewSelect"
                      value={form.industry}
                      onChange={handleField("industry")}
                    >
                      <option value="">Select an industry…</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="reviewError">{errors.industry}</p>
                    )}
                  </div>
                </div>

                <div className="reviewField" style={{ marginBottom: 12 }}>
                  <label className="reviewLabel" htmlFor="address">
                    Shipping Address<span className="req">*</span>
                  </label>
                  <textarea
                    id="address"
                    className="reviewTextarea"
                    value={form.address}
                    onChange={handleField("address")}
                    placeholder="Street, city, postal code"
                  />
                  {errors.address && (
                    <p className="reviewError">{errors.address}</p>
                  )}
                </div>

                <div className="reviewField" style={{ marginBottom: 12 }}>
                  <label className="reviewLabel" htmlFor="website">
                    Website
                  </label>
                  <input
                    id="website"
                    className="reviewInput"
                    value={form.website}
                    onChange={handleField("website")}
                    placeholder="Optional"
                  />
                </div>

                <div className="reviewField">
                  <label className="reviewLabel" htmlFor="notes">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    maxLength={300}
                    className="reviewTextarea"
                    value={form.notes}
                    onChange={handleField("notes")}
                    placeholder="Optional — max 300 characters"
                  />
                  <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
                    {form.notes.length}/300
                  </p>
                  {errors.notes && (
                    <p className="reviewError">{errors.notes}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SHIPPING ESTIMATE */}
            {form.country && (
              <div className="reviewShippingBar" role="status">
                {rateLoading ? (
                  <div className="reviewSkeleton" />
                ) : rate?.found && rate.data ? (
                  <>
                    <span className="reviewShippingBar__lead">
                      Estimated shipping to <strong>{rate.data.country}</strong>:
                    </span>
                    <span className="reviewShippingBar__price">
                      ${rate.data.rateUsd} USD · {rate.data.transitDays} via DHL Express
                    </span>
                  </>
                ) : (
                  <span className="reviewShippingBar__lead">
                    We will calculate shipping for your location. Proceed and we
                    will confirm the cost by email within 24 hours.
                  </span>
                )}
              </div>
            )}

            {/* ACTION BAR */}
            <div className="reviewActionBar">
              <Link href="/catalog/raw-leather" className="reviewBackLink">
                ← Back to catalog
              </Link>
              <div style={{ minWidth: 220 }}>
                {paypalLoadError && (
                  <p className="reviewError">{paypalLoadError}</p>
                )}
                {globalError && <p className="reviewError">{globalError}</p>}
                {!isFormValid && !paypalLoadError && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "hsl(var(--muted-foreground))",
                      marginBottom: 6,
                    }}
                  >
                    {!rate?.found
                      ? "Select a country to see your shipping cost."
                      : "Complete the required fields to continue."}
                  </p>
                )}
                <div ref={paypalSlotRef} className="reviewPaypalSlot" />
                {submitting && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "hsl(var(--muted-foreground))",
                      marginTop: 6,
                    }}
                  >
                    Finalising your order…
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {mode === "HIDE" && <SampleTrayBar />}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewPageInner />
    </Suspense>
  );
}
