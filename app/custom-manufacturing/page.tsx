"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./custom.css";

// --- Form Options (Mirroring backend schema enums where applicable) ---
const productTypes = [
  "Wallets", "Bags & Purses", "Belts & Straps", "Accessories", "Footwear", "Upholstery", "Other",
];
const preferredMaterials = [
  "Cowhide", "Buffalo", "Goat", "Sheep", "Exotic", "Not sure",
];
const timelines = [
  "Rush (2-4 weeks)", "Standard (4-8 weeks)", "Flexible (8+ weeks)",
];
const budgetRanges = [
  "Under $5,000", "$5,000 - $15,000", "$15,000 - $50,000", "Over $50,000", "Prefer to discuss",
];

// --- Constants for file upload limits ---
const MAX_FILE_SIZE_MB = 25;
const MAX_TOTAL_FILES = 5;
const ALLOWED_MIMETYPES = [
  "application/pdf", "image/jpeg", "image/png", "image/gif",
  "image/x-adobe-ai", "application/postscript",
  "image/vnd.adobe.photoshop", "image/psd",
  "application/dxf", "application/x-autocad",
  "application/vnd.oasis.opendocument.text",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface FormDataState {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  productType: string;
  estimatedQuantity: string;
  preferredMaterial: string;
  colors: string;
  timeline: string;
  specifications: string;
  budgetRange: string;
}

export default function CustomManufacturingPage() {
  const router = useRouter();
  const formSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormDataState>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    productType: productTypes[0],
    estimatedQuantity: "",
    preferredMaterial: preferredMaterials[0],
    colors: "",
    timeline: timelines[0],
    specifications: "",
    budgetRange: budgetRanges[0],
  });
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // IntersectionObserver scroll reveal
  useEffect(() => {
    const reveals = document.querySelectorAll(".cmPage .reveal");
    if (!reveals.length) return;
    if (typeof IntersectionObserver === "undefined") {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newlySelectedFiles = Array.from(e.target.files);
    const newErrors: { [key: string]: string } = { ...errors };
    let filesToAdd: File[] = [];
    let fileErrorOccurred = false;

    if (fileInputRef.current) fileInputRef.current.value = "";

    if (designFiles.length + newlySelectedFiles.length > MAX_TOTAL_FILES) {
      toast.error(`You can upload a maximum of ${MAX_TOTAL_FILES} design files.`);
      newErrors.designFiles = `Maximum of ${MAX_TOTAL_FILES} files allowed.`;
      fileErrorOccurred = true;
    }

    newlySelectedFiles.forEach((file) => {
      const isSizeValid = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      const isTypeValid = ALLOWED_MIMETYPES.includes(file.type);
      if (!isSizeValid) {
        toast.error(`File '${file.name}' exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        newErrors.designFiles = newErrors.designFiles || `Some files exceeded ${MAX_FILE_SIZE_MB}MB.`;
        fileErrorOccurred = true;
      }
      if (!isTypeValid) {
        toast.error(`File '${file.name}' has an unsupported format. Supported: PDF, JPG, PNG, AI, PSD, DWG, GIF.`);
        newErrors.designFiles = newErrors.designFiles || "Some files have unsupported formats.";
        fileErrorOccurred = true;
      }
      if (isSizeValid && isTypeValid) filesToAdd.push(file);
    });

    const currentTotal = designFiles.length + filesToAdd.length;
    if (currentTotal > MAX_TOTAL_FILES) {
      const availableSlots = MAX_TOTAL_FILES - designFiles.length;
      if (availableSlots > 0) {
        filesToAdd = filesToAdd.slice(0, availableSlots);
        toast.error(`Only ${availableSlots} more file(s) could be added to reach the maximum of ${MAX_TOTAL_FILES}.`);
        newErrors.designFiles = newErrors.designFiles || `Maximum of ${MAX_TOTAL_FILES} files allowed.`;
        fileErrorOccurred = true;
      } else {
        filesToAdd = [];
      }
    }

    setDesignFiles((prev) => [...prev, ...filesToAdd]);
    if (!fileErrorOccurred) delete newErrors.designFiles;
    setErrors(newErrors);
  };

  const removeDesignFile = (index: number) => {
    setDesignFiles((prev) => prev.filter((_, i) => i !== index));
    if (errors.designFiles && designFiles.length - 1 <= MAX_TOTAL_FILES) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.designFiles;
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company Name is required.";
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact Person is required.";
    if (!formData.email.trim()) newErrors.email = "Email Address is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format.";
    if (!formData.productType.trim()) newErrors.productType = "Product Type is required.";
    if (!formData.estimatedQuantity.trim()) newErrors.estimatedQuantity = "Estimated Quantity is required.";
    // Business rule: custom manufacturing requires user-provided specs OR a
    // design file/image before submission (one of the two is mandatory).
    const hasSpecs = formData.specifications.trim().length > 0;
    const hasFiles = designFiles.length > 0;
    if (!hasSpecs && !hasFiles) {
      newErrors.specifications =
        "Please describe your specifications OR upload at least one design file.";
      newErrors.designFiles =
        "Please upload at least one design file OR describe your specifications.";
    }
    if (designFiles.length > MAX_TOTAL_FILES) {
      newErrors.designFiles = `You can upload a maximum of ${MAX_TOTAL_FILES} design files.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalCloseAndRedirect = () => {
    setShowSuccessModal(false);
    router.push("/catalog");
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      designFiles.forEach((file) => data.append("designFiles", file));

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/custom-manufacturing`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        setShowSuccessModal(true);
        setFormData({
          companyName: "", contactPerson: "", email: "", phone: "",
          productType: productTypes[0], estimatedQuantity: "",
          preferredMaterial: preferredMaterials[0], colors: "",
          timeline: timelines[0], specifications: "",
          budgetRange: budgetRanges[0],
        });
        setDesignFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(response.data.message || "Submission failed.");
      }
    } catch (error: any) {
      console.error("Custom request submission error:", error.response?.data || error.message);
      let errorMessage = "An unexpected error occurred.";
      let detailedErrors: { [key: string]: string } = {};

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const backendResponse = error.response.data;
          if (backendResponse && backendResponse.errors && Array.isArray(backendResponse.errors)) {
            detailedErrors = backendResponse.errors.reduce((acc: any, err: any) => {
              const path = Array.isArray(err.path) ? err.path.join(".") : err.path;
              const fieldName = path.startsWith("body.") ? path.substring(5) : path;
              acc[fieldName] = err.message;
              return acc;
            }, {});
            errorMessage = "Validation failed. Please check your inputs.";
          } else if (backendResponse && backendResponse.message) {
            errorMessage = backendResponse.message;
          } else {
            errorMessage = `Server Error: ${error.response.status} ${error.response.statusText || "Unknown Status"}`;
          }
        } else if (error.request) {
          errorMessage = "Network Error: No response from server. Please check your internet connection.";
        } else {
          errorMessage = `Request Setup Error: ${error.message}`;
        }
      } else {
        errorMessage = `Unexpected Client Error: ${error.message}`;
      }

      setErrors(detailedErrors);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Font Awesome 6 icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <Header />
      <Toaster position="top-center" reverseOrder={false} />

      <main className="cmPage">
        {/* HERO */}
        <section className="cm-hero" aria-labelledby="cmHeroTitle">
          <div className="cm-container">
            <div className="cm-hero__inner reveal">
              <span className="cm-hero__eyebrow">Custom Manufacturing &amp; Private Label</span>
              <h1 id="cmHeroTitle">Custom Leather Manufacturing &amp; Private Label Solutions</h1>
              <p className="cm-hero__sub">
                Manufacture premium leather products under your brand &mdash; without the overhead.
                From raw hide finishing to fully customized goods, Pure Grain Exports is your silent
                manufacturing partner.
              </p>
              <div className="cm-hero__ctas">
                <button type="button" className="btn btn--gold" onClick={scrollToForm}>
                  <i className="fa-solid fa-file-invoice" aria-hidden="true"></i>
                  Request Custom Quote
                </button>
                <button type="button" className="btn btn--gold-outline" onClick={scrollToForm}>
                  <i className="fa-solid fa-leaf" aria-hidden="true"></i>
                  Submit Your Design
                </button>
              </div>
              <div className="cm-hero__trust" role="list">
                <span role="listitem"><i className="fa-solid fa-industry" aria-hidden="true"></i> Premium Tanneries</span>
                <span role="listitem"><i className="fa-solid fa-tag" aria-hidden="true"></i> OEM &amp; Private Label</span>
                <span role="listitem"><i className="fa-solid fa-globe" aria-hidden="true"></i> Export-Ready Production</span>
              </div>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="cm-block parchment-texture" aria-labelledby="cmIntroTitle">
          <div className="cm-container">
            <div className="intro">
              <div className="intro-text reveal">
                <span className="split__icon">
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                  End-to-End Manufacturing
                </span>
                <h2 id="cmIntroTitle">Source, Customize, and Manufacture &mdash; All Under Your Brand</h2>
                <div className="gold-rule" style={{ marginLeft: 0, marginTop: 10, marginBottom: 26 }}></div>
                <p>
                  At <strong>Pure Grain Exports</strong>, we enable global businesses to source, customize,
                  and manufacture high-quality leather hides and finished leather products &mdash; all
                  under their own brand.
                </p>
                <p>
                  Whether you are a retailer, wholesaler, or emerging brand, we provide a complete
                  end-to-end manufacturing solution that allows you to reduce costs, maintain quality,
                  and scale efficiently.
                </p>
                <p>
                  From raw leather finishing to fully customized products, we ensure your requirements
                  are executed with precision, consistency, and export-grade standards.
                </p>
                <a href="#cm-offer" className="btn btn--gold-outline" style={{ marginTop: 8 }}>
                  Explore What We Offer
                  <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                </a>
              </div>

              <div className="img-frame img-frame--accent reveal" aria-hidden="true">
                <img
                  src="https://images.unsplash.com/photo-1605518293941-cee0c8a3f7c1?auto=format&fit=crop&w=1200&q=80"
                  alt="Stacked rolls of premium tanned leather hides"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — 3 image cards */}
        <section className="cm-block" style={{ background: "#fff" }} aria-labelledby="cmHowTitle">
          <div className="cm-container">
            <div className="section-head reveal">
              <h2 id="cmHowTitle">How Custom Manufacturing Works</h2>
              <p className="section-sub">
                A streamlined process from concept to delivery &mdash; designed for clarity and confidence at every stage.
              </p>
              <div className="gold-rule"></div>
            </div>

            <div className="how-grid">
              {[
                {
                  num: "01",
                  icon: "fa-cloud-arrow-up",
                  title: "Submit Your Design",
                  desc: "Upload sketches, CAD files, reference images, or detailed specifications. Our team accepts all common file formats.",
                  img: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
                  alt: "Designer sketching leather product concepts on paper",
                },
                {
                  num: "02",
                  icon: "fa-file-invoice-dollar",
                  title: "Review & Quote",
                  desc: "Within 72 hours, receive a detailed proposal with pricing, materials breakdown, and production timeline.",
                  img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
                  alt: "Professional reviewing a quotation document on a desk",
                },
                {
                  num: "03",
                  icon: "fa-circle-check",
                  title: "Prototype & Production",
                  desc: "Approve samples, then we begin full production with quality checks at every stage before secure delivery.",
                  img: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=80",
                  alt: "Artisan crafting a leather product prototype at a workbench",
                },
              ].map((step) => (
                <article key={step.num} className="how-card reveal">
                  <div className="how-card__media">
                    <img src={step.img} alt={step.alt} loading="lazy" />
                    <div className="how-card__badge">
                      <span className="how-card__num">{step.num}</span>
                      <i className={`fa-solid ${step.icon} how-card__icon`} aria-hidden="true"></i>
                    </div>
                  </div>
                  <div className="how-card__body">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT WE OFFER */}
        <section className="cm-block" id="cm-offer" style={{ background: "#fff" }} aria-labelledby="cmOfferTitle">
          <div className="cm-container">
            <div className="section-head reveal">
              <h2 id="cmOfferTitle">What We Offer</h2>
              <p className="section-sub">
                Two complementary capabilities &mdash; raw leather finishing and finished product
                manufacturing &mdash; available individually or as a fully integrated supply.
              </p>
              <div className="gold-rule"></div>
            </div>

            <div className="split reveal">
              <div className="split__media img-frame">
                <img
                  src="https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=1200&q=80"
                  alt="Close-up of finished tan leather hide"
                  loading="lazy"
                />
              </div>
              <div className="split__body">
                <span className="split__icon">
                  <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
                  Hides &amp; Sheets
                </span>
                <h3>Custom Leather Finishing</h3>
                <p>
                  We work with some of the most reputable tanneries to deliver leather tailored
                  exactly to your specifications &mdash; ready for bags, footwear, upholstery,
                  or accessories.
                </p>
                <ul className="feature-list">
                  <li><i className="fa-solid fa-check"></i><span><strong>Thickness</strong> &mdash; calibrated to your product requirement</span></li>
                  <li><i className="fa-solid fa-check"></i><span><strong>Finishes</strong> &mdash; Aniline, Semi-Aniline, Pigmented</span></li>
                  <li><i className="fa-solid fa-check"></i><span><strong>Leather Types</strong> &mdash; Full Grain, Top Grain, Corrected Grain</span></li>
                  <li><i className="fa-solid fa-check"></i><span><strong>Colors</strong> &mdash; Custom color matching available</span></li>
                  <li><i className="fa-solid fa-check"></i><span><strong>Texture &amp; Feel</strong> &mdash; Smooth, matte, glossy, embossed</span></li>
                  <li><i className="fa-solid fa-check"></i><span><strong>Softness &amp; durability</strong> adjustments per end-use</span></li>
                </ul>
                <p className="pull-note">
                  Whether you need leather for bags, footwear, upholstery, or accessories &mdash;
                  we deliver ready-to-use, export-quality material.
                </p>
              </div>
            </div>

            <div className="split split--reverse reveal">
              <div className="split__media img-frame">
                <img
                  src="https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=80"
                  alt="Skilled artisan stitching a finished leather handbag"
                  loading="lazy"
                />
              </div>
              <div className="split__body">
                <span className="split__icon">
                  <i className="fa-solid fa-tag" aria-hidden="true"></i>
                  Private Label / OEM
                </span>
                <h3>Custom Product Manufacturing</h3>
                <p>
                  We collaborate with top-tier manufacturers to produce finished leather goods
                  that meet international quality expectations &mdash; sold under your brand.
                </p>
                <ul className="feature-list">
                  <li><i className="fa-solid fa-check"></i><span>Wallets, card holders, and small leather goods</span></li>
                  <li><i className="fa-solid fa-check"></i><span>Handbags, totes, and duffel bags</span></li>
                  <li><i className="fa-solid fa-check"></i><span>Leather jackets and garments</span></li>
                  <li><i className="fa-solid fa-check"></i><span>Shoes &amp; footwear</span></li>
                  <li><i className="fa-solid fa-check"></i><span>Belts &amp; accessories</span></li>
                  <li><i className="fa-solid fa-check"></i><span>Other custom-designed leather products</span></li>
                </ul>
                <p className="pull-note">
                  You sell the product as your own &mdash; we remain your silent manufacturing partner.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS GRID */}
        <section className="cm-block parchment-mid-texture" aria-labelledby="cmProductsTitle">
          <div className="cm-container">
            <div className="section-head reveal">
              <h2 id="cmProductsTitle">Finished Products We Manufacture</h2>
              <p className="section-sub">
                A core product portfolio delivered consistently to international buyers &mdash; or
                fully customized to your brand and design.
              </p>
              <div className="gold-rule"></div>
            </div>

            <div className="products-grid">
              {[
                { icon: "fa-wallet", title: "Wallets & Small Goods", desc: "Bifolds, cardholders, money clips, passport covers — precision stitching, edge-paint finishing.", img: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80" },
                { icon: "fa-bag-shopping", title: "Handbags & Totes", desc: "Structured handbags, slouchy totes, and crossbody designs in full-grain or top-grain leather.", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80" },
                { icon: "fa-suitcase-rolling", title: "Duffel & Travel Bags", desc: "Weekenders, travel duffels, and laptop bags — built for daily use and refined aesthetics.", img: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80" },
                { icon: "fa-shirt", title: "Leather Jackets & Garments", desc: "Biker, bomber, racer, and classic-fit leather jackets in cowhide, lambskin, and goat skin.", img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80" },
                { icon: "fa-shoe-prints", title: "Shoes & Footwear", desc: "Dress shoes, loafers, boots, and casuals — Goodyear welt and cemented constructions.", img: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=80" },
                { icon: "fa-link", title: "Belts & Accessories", desc: "Dress belts, casual belts, watch straps, and gift sets — finished to retail-ready standards.", img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80" },
              ].map((p) => (
                <article key={p.title} className="product-card reveal">
                  <div className="product-card__media">
                    <span className="product-card__icon"><i className={`fa-solid ${p.icon}`} aria-hidden="true"></i></span>
                    <img src={p.img} alt={p.title} loading="lazy" />
                  </div>
                  <div className="product-card__body">
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* BRAND BAND */}
        <section className="brand-band" aria-labelledby="cmBrandTitle">
          <div className="cm-container">
            <div className="brand-band__inner">
              <div className="reveal">
                <span className="split__icon">
                  <i className="fa-solid fa-stamp" aria-hidden="true"></i>
                  Branding &amp; Identity
                </span>
                <h2 id="cmBrandTitle">Your Brand, Your Identity</h2>
                <p>
                  We understand that branding is everything. That is why every finished product can
                  be personalized so the customer sees only your brand &mdash; never ours.
                </p>
                <p>
                  From discreet brand stamps on a wallet to full retail packaging with hangtags,
                  barcodes, and care cards, we adapt to the level of finish your market demands.
                </p>
                <div className="silent-quote">
                  You sell the product as your own &mdash; we remain your silent manufacturing partner.
                </div>
              </div>

              <ul className="brand-options reveal">
                <li>
                  <i className="fa-solid fa-stamp" aria-hidden="true"></i>
                  <div>
                    <strong>Custom Logo Stamping &amp; Embossing</strong>
                    <span>Hot-stamped, debossed, or foil-embossed brand marks on every unit.</span>
                  </div>
                </li>
                <li>
                  <i className="fa-solid fa-tag" aria-hidden="true"></i>
                  <div>
                    <strong>Private Labeling</strong>
                    <span>Branded leather patches, woven labels, hangtags, and care cards.</span>
                  </div>
                </li>
                <li>
                  <i className="fa-solid fa-box" aria-hidden="true"></i>
                  <div>
                    <strong>Custom Packaging Options</strong>
                    <span>Branded polybags, dust bags, gift boxes, mailer cartons, and barcoding.</span>
                  </div>
                </li>
                <li>
                  <i className="fa-solid fa-pen-ruler" aria-hidden="true"></i>
                  <div>
                    <strong>Design Collaboration</strong>
                    <span>From your sketch or tech-pack to a physical sample for approval.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="cm-block parchment-texture" aria-labelledby="cmWhyTitle">
          <div className="cm-container">
            <div className="section-head reveal">
              <h2 id="cmWhyTitle">Why Global Businesses Choose Us</h2>
              <p className="section-sub">We don&rsquo;t just supply &mdash; we build long-term manufacturing partnerships.</p>
              <div className="gold-rule"></div>
            </div>

            <div className="why-grid">
              {[
                { icon: "fa-industry", title: "Premium Tanneries & Skilled Manufacturers", desc: "Direct access to vetted tanneries and craft workshops in Pakistan’s leather hubs." },
                { icon: "fa-shield-halved", title: "Consistent Quality Control", desc: "Multi-stage QC from raw selection to final pack — standards locked at sample stage." },
                { icon: "fa-coins", title: "Competitive Bulk Pricing", desc: "Volume-based pricing structured for sustainable margins on retail and wholesale." },
                { icon: "fa-sliders", title: "Flexible Customization", desc: "Materials, finishes, construction, hardware, and packaging — built around your spec." },
                { icon: "fa-ship", title: "Reliable Export Handling", desc: "Export-grade packing, full documentation set, and on-time global delivery." },
                { icon: "fa-handshake", title: "Long-Term Partnership", desc: "We invest in repeat clients with consistent terms, dedicated account support, and transparency." },
              ].map((w) => (
                <div key={w.title} className="why-card reveal">
                  <div className="icon"><i className={`fa-solid ${w.icon}`} aria-hidden="true"></i></div>
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="cm-block" style={{ background: "#fff" }} aria-labelledby="cmProcessTitle">
          <div className="cm-container">
            <div className="section-head reveal">
              <h2 id="cmProcessTitle">Our Process &mdash; Simple &amp; Transparent</h2>
              <p className="section-sub">Six clear stages from your first inquiry to global delivery &mdash; no surprises.</p>
              <div className="gold-rule"></div>
            </div>

            <ol className="process" role="list">
              {[
                { n: 1, h: "Submit Your Requirements", p: "Share your product specifications, designs, reference images, or ideas. The more detail you provide, the more precise our quotation." },
                { n: 2, h: "Get Expert Consultation", p: "Our team guides you on materials, finishes, construction, and cost optimization — ensuring the best balance of quality and price." },
                { n: 3, h: "Request a Free Sample", p: "We develop and ship a physical sample for your evaluation. You confirm specifications before any bulk production begins." },
                { n: 4, h: "Finalize Order (MOQ Applicable)", p: "Once approved, we issue a Proforma Invoice and production begins per the agreed minimum order quantity, lead time, and Incoterms." },
                { n: 5, h: "Production & Quality Control", p: "Strict in-house and third-party (SGS / Intertek / Bureau Veritas, on request) quality checks ensure consistency across the order." },
                { n: 6, h: "Global Delivery", p: "We handle export packing, full documentation, and freight — delivering on time to your nominated port or door." },
              ].map((s) => (
                <li key={s.n} className="process-step reveal">
                  <div className="process-step__num">{s.n}</div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SCALE */}
        <section className="cm-block parchment-mid-texture" aria-labelledby="cmScaleTitle">
          <div className="cm-container">
            <div className="section-head reveal">
              <h2 id="cmScaleTitle">Designed for Businesses That Want to Scale</h2>
              <p className="section-sub">A complete backend manufacturing solution &mdash; so you can focus on selling and growing your business.</p>
              <div className="gold-rule"></div>
            </div>

            <div className="scale-grid">
              {[
                { icon: "fa-rocket", h: "Launching a New Leather Brand", p: "Get production-ready quickly with sample development, low entry barriers, and full private-label support." },
                { icon: "fa-chart-line", h: "Expanding Your Product Line", p: "Add new categories — bags, jackets, footwear, accessories — under one trusted partner." },
                { icon: "fa-coins", h: "Reducing Manufacturing Costs", p: "Move to a lower-cost base without compromising quality, lead time, or compliance." },
              ].map((s) => (
                <article key={s.h} className="scale-card reveal">
                  <div className="icon"><i className={`fa-solid ${s.icon}`} aria-hidden="true"></i></div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA + FORM */}
        <section
          className="cm-block cta-band leather-texture"
          id="quote"
          aria-labelledby="cmQuoteTitle"
          ref={formSectionRef}
        >
          <div className="cm-container">
            <div className="section-head reveal">
              <span className="cm-hero__eyebrow">Get Started</span>
              <h2 id="cmQuoteTitle">Request Your Custom Quote</h2>
              <p className="section-sub">Ready to bring your product ideas to life? Share your requirements and upload your designs.</p>
              <div className="gold-rule"></div>
            </div>

            <div className="cta-card reveal">
              <div className="cta-card__benefits">
                <div>
                  <i className="fa-solid fa-tags" aria-hidden="true"></i>
                  <strong>Tailored Pricing</strong>
                </div>
                <div>
                  <i className="fa-solid fa-lightbulb" aria-hidden="true"></i>
                  <strong>Expert Recommendations</strong>
                </div>
                <div>
                  <i className="fa-solid fa-leaf" aria-hidden="true"></i>
                  <strong>Free Sample Development</strong>
                </div>
              </div>

              <form className="cm-form" onSubmit={handleSubmit} noValidate>
                {/* Company Info */}
                <div className="cm-form__section">
                  <h3 className="cm-form__section-title">Company Information</h3>
                  <div className="cm-form__row">
                    <div className="cm-field">
                      <label htmlFor="companyName">Company Name<span className="req">*</span></label>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        placeholder="Your Company Ltd."
                        value={formData.companyName}
                        onChange={handleChange}
                        className={`cm-input ${errors.companyName ? "is-error" : ""}`}
                        required
                      />
                      {errors.companyName && <p className="cm-error">{errors.companyName}</p>}
                    </div>
                    <div className="cm-field">
                      <label htmlFor="contactPerson">Contact Person<span className="req">*</span></label>
                      <input
                        id="contactPerson"
                        name="contactPerson"
                        type="text"
                        placeholder="John Doe"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className={`cm-input ${errors.contactPerson ? "is-error" : ""}`}
                        required
                      />
                      {errors.contactPerson && <p className="cm-error">{errors.contactPerson}</p>}
                    </div>
                  </div>
                  <div className="cm-form__row">
                    <div className="cm-field">
                      <label htmlFor="email">Email Address<span className="req">*</span></label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={`cm-input ${errors.email ? "is-error" : ""}`}
                        required
                      />
                      {errors.email && <p className="cm-error">{errors.email}</p>}
                    </div>
                    <div className="cm-field">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleChange}
                        className="cm-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="cm-form__section">
                  <h3 className="cm-form__section-title">Project Details</h3>
                  <div className="cm-form__row">
                    <div className="cm-field">
                      <label htmlFor="productType">Product Type<span className="req">*</span></label>
                      <select
                        id="productType"
                        name="productType"
                        value={formData.productType}
                        onChange={handleChange}
                        className={`cm-select ${errors.productType ? "is-error" : ""}`}
                      >
                        {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.productType && <p className="cm-error">{errors.productType}</p>}
                    </div>
                    <div className="cm-field">
                      <label htmlFor="estimatedQuantity">Estimated Quantity<span className="req">*</span></label>
                      <input
                        id="estimatedQuantity"
                        name="estimatedQuantity"
                        type="text"
                        placeholder="e.g., 500 pieces"
                        value={formData.estimatedQuantity}
                        onChange={handleChange}
                        className={`cm-input ${errors.estimatedQuantity ? "is-error" : ""}`}
                        required
                      />
                      {errors.estimatedQuantity && <p className="cm-error">{errors.estimatedQuantity}</p>}
                    </div>
                  </div>
                  <div className="cm-form__row cm-form__row--3">
                    <div className="cm-field">
                      <label htmlFor="preferredMaterial">Preferred Material</label>
                      <select
                        id="preferredMaterial"
                        name="preferredMaterial"
                        value={formData.preferredMaterial}
                        onChange={handleChange}
                        className="cm-select"
                      >
                        {preferredMaterials.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="cm-field">
                      <label htmlFor="colors">Colors</label>
                      <input
                        id="colors"
                        name="colors"
                        type="text"
                        placeholder="e.g., Black, Brown, Custom"
                        value={formData.colors}
                        onChange={handleChange}
                        className="cm-input"
                      />
                    </div>
                    <div className="cm-field">
                      <label htmlFor="timeline">Timeline</label>
                      <select
                        id="timeline"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleChange}
                        className="cm-select"
                      >
                        {timelines.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Design Upload */}
                <div className="cm-form__section">
                  <h3 className="cm-form__section-title">Design Upload</h3>
                  <label
                    htmlFor="designFiles"
                    className={`cm-dropzone ${errors.designFiles ? "is-error" : ""}`}
                  >
                    <input
                      id="designFiles"
                      name="designFiles"
                      type="file"
                      multiple
                      accept={ALLOWED_MIMETYPES.join(",")}
                      onChange={handleDesignFileChange}
                      ref={fileInputRef}
                      style={{ display: "none" }}
                    />
                    <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
                    <h4>Drop your design files here</h4>
                    <p>or click to browse from your computer</p>
                    <button
                      type="button"
                      className="btn btn--gold-outline"
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                      disabled={designFiles.length >= MAX_TOTAL_FILES}
                    >
                      <i className="fa-solid fa-folder-open" aria-hidden="true"></i>
                      {designFiles.length >= MAX_TOTAL_FILES ? `Max ${MAX_TOTAL_FILES} Files` : "Choose Files"}
                    </button>
                    <p className="cm-dropzone__hint">
                      Supported: PDF, JPG, PNG, AI, PSD, DWG, GIF (Max {MAX_FILE_SIZE_MB}MB per file, Max {MAX_TOTAL_FILES} files)
                    </p>
                  </label>
                  {errors.designFiles && <p className="cm-error">{errors.designFiles}</p>}

                  {designFiles.length > 0 && (
                    <ul className="cm-file-list">
                      {designFiles.map((file, index) => (
                        <li key={`${file.name}-${index}`}>
                          <span className="name">
                            <i className="fa-solid fa-file"></i>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDesignFile(index)}
                            disabled={loading}
                            aria-label={`Remove ${file.name}`}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Additional */}
                <div className="cm-form__section">
                  <h3 className="cm-form__section-title">Additional Requirements</h3>
                  <div className="cm-field">
                    <label htmlFor="specifications">Detailed Specifications</label>
                    <textarea
                      id="specifications"
                      name="specifications"
                      placeholder="Please describe your requirements in detail: dimensions, special features, branding requirements, packaging needs, etc."
                      value={formData.specifications}
                      onChange={handleChange}
                      className="cm-textarea"
                    />
                  </div>
                  <div className="cm-field">
                    <label htmlFor="budgetRange">Budget Range (Optional)</label>
                    <select
                      id="budgetRange"
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      className="cm-select"
                    >
                      {budgetRanges.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="cm-form__submit">
                  <button type="submit" className="btn btn--gold btn--lg" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="cm-spinner" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                        Submit Custom Manufacturing Request
                      </>
                    )}
                  </button>
                  <p className="cm-form__note">
                    Our design team reviews requests within 72 hours and responds with a detailed proposal and timeline.
                  </p>
                </div>
              </form>
            </div>

            <p className="outro">
              Let&rsquo;s build your brand &mdash; together. With the right manufacturing partner,
              scaling your leather business becomes faster, easier, and more profitable.
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="cmPage">
          <div className="cm-modal-overlay" role="dialog" aria-modal="true">
            <div className="cm-modal">
              <div className="cm-modal__icon">
                <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
              </div>
              <h3>Request Submitted!</h3>
              <p>
                Thank you for your custom manufacturing request. Our design team will
                review your project and get back to you with a detailed proposal within
                <strong> 72 hours</strong>.
              </p>
              <button
                type="button"
                className="btn btn--gold btn--lg"
                onClick={handleModalCloseAndRedirect}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
