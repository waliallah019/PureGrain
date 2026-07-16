// my-leather-platform/components/raw-leather-details/RawLeatherDetailContent.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  FileText,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { IRawLeather } from "@/types/rawLeather";
import PriceDisplay from "@/components/PriceDisplay";
import RawLeatherCard from "@/components/raw-leather-details/RawLeatherCard";
import AddToSampleTrayButton from "@/components/sample-request/AddToSampleTrayButton";

interface RawLeatherDetailContentProps {
  rawLeather: IRawLeather;
  relatedRawLeather: IRawLeather[];
}

export default function RawLeatherDetailContent({
  rawLeather,
  relatedRawLeather,
}: RawLeatherDetailContentProps) {
  const primaryImage = rawLeather.images?.[0] || "/placeholder-image.jpg";
  const images = rawLeather.images && rawLeather.images.length > 0 ? rawLeather.images : [primaryImage];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const selectedImage = images[selectedIndex] || primaryImage;

  const featureItems = useMemo(() => {
    const items = [
      `Leather type: ${rawLeather.leatherType}`,
      `Animal: ${rawLeather.animal}`,
      `Finish: ${rawLeather.finish}`,
      `Thickness: ${rawLeather.thickness}`,
      rawLeather.sampleAvailable ? "Sample requests available" : null,
      rawLeather.negotiable ? "Pricing negotiable" : null,
      rawLeather.discountAvailable ? "Volume discounts available" : null,
    ].filter(Boolean) as string[];

    return items;
  }, [rawLeather]);

  const chipItems = useMemo(() => {
    if (rawLeather.colors && rawLeather.colors.length > 0) {
      return rawLeather.colors;
    }

    return [rawLeather.animal, rawLeather.finish].filter(Boolean);
  }, [rawLeather]);

  const specifications = useMemo(() => {
    const specs = [
      { label: "Thickness", value: rawLeather.thickness },
      { label: "Finish", value: rawLeather.finish },
      { label: "Animal", value: rawLeather.animal },
      { label: "Leather Type", value: rawLeather.leatherType },
      rawLeather.size ? { label: "Hide Size", value: rawLeather.size } : null,
      {
        label: "MOQ",
        value: `${rawLeather.minOrderQuantity} sq ft`,
      },
    ].filter(Boolean) as { label: string; value: string }[];

    if (rawLeather.colors && rawLeather.colors.length > 0) {
      specs.push({
        label: "Color Range",
        value: rawLeather.colors.join(", "),
      });
    }

    return specs;
  }, [rawLeather]);

  const getRelatedTags = (item: IRawLeather) => {
    const baseTags = (item.colors || []).filter(Boolean);
    const fallbackTags = [item.animal, item.finish].filter(Boolean);
    const merged = baseTags.length > 0 ? baseTags : fallbackTags;
    return Array.from(new Set(merged)).slice(0, 3);
  };

  const handlePrevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <>
      {/* Breadcrumb */}
      <section className="pt-24 pb-4 bg-bone">
        <div className="container-wide">
          <Link
            href="/catalog/raw-leather"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Collection
          </Link>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-12 bg-bone">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative aspect-square overflow-hidden border border-border">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  aria-label="Open full size image"
                  className="absolute inset-0 z-10 cursor-zoom-in"
                />
                <Image
                  src={selectedImage}
                  alt={rawLeather.name}
                  width={1200}
                  height={1200}
                  className="w-full h-full object-cover"
                  priority
                />
                <span className="pointer-events-none absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 bg-background/85 px-2 py-1 text-xs text-foreground">
                  <Expand className="h-3.5 w-3.5" />
                  Click to enlarge
                </span>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-sm transition hover:bg-background"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-sm transition hover:bg-background"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-2 sm:flex sm:gap-3 sm:overflow-x-auto sm:pb-2">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`aspect-square w-full overflow-hidden border transition-colors sm:h-20 sm:w-20 sm:flex-shrink-0 ${
                        selectedIndex === index
                          ? "border-brass"
                          : "border-border hover:border-brass/60"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${rawLeather.name} thumbnail`}
                        width={160}
                        height={160}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p className="text-label text-brass mb-4">{rawLeather.leatherType}</p>
              <h1 className="heading-section text-foreground mb-6">
                {rawLeather.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {rawLeather.sampleAvailable && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs">
                    <ShoppingCart className="h-3 w-3" /> Sample Available
                  </span>
                )}
                {rawLeather.negotiable && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs">
                    Negotiable
                  </span>
                )}
                {rawLeather.isFeatured && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
              <div className="mb-6 text-lg text-foreground">
                <span className="text-foreground/70">Price:</span>{" "}
                <span className="font-semibold inline-flex items-baseline gap-1">
                  <PriceDisplay usdAmount={rawLeather.pricePerSqFt} showOriginal />
                  <span>/ sq ft</span>
                </span>
              </div>
              <div className="divider-brass mb-6" />
              <p className="text-body mb-8">{rawLeather.description}</p>

              {/* Features */}
              <div className="mb-8">
                <h3 className="font-serif text-lg font-medium text-foreground mb-4">
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {featureItems.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check size={16} className="text-brass flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Available Colors */}
              <div className="mb-8">
                <h3 className="font-serif text-lg font-medium text-foreground mb-4">
                  Available Colors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {chipItems.map((item) => (
                    <span
                      key={item}
                      className="px-4 py-2 bg-secondary text-secondary-foreground text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                {rawLeather.sampleAvailable && (
                  <AddToSampleTrayButton
                    className="w-full sm:w-auto"
                    hide={{
                      productId: String(rawLeather._id),
                      productName: rawLeather.name,
                      hideType: rawLeather.animal,
                      grade: rawLeather.leatherType,
                      thickness: rawLeather.thickness,
                      finish: rawLeather.finish,
                      image: rawLeather.images?.[0],
                    }}
                  />
                )}
                <Link
                  href={`/quote-request?itemId=${rawLeather._id}&itemName=${encodeURIComponent(rawLeather.name)}&itemTypeCategory=raw-leather`}
                  className="btn-secondary w-full sm:w-auto justify-center"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Get Quote
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="section-padding">
        <div className="container-wide">
          <h2 className="heading-subsection text-foreground mb-8">
            Technical Specifications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-background">
            {specifications.map((spec) => (
              <div key={spec.label} className="p-6 bg-background">
                <p className="text-xs text-muted-foreground mb-2">{spec.label}</p>
                <p className="font-serif text-lg font-medium text-foreground">
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Leather Hides */}
      {relatedRawLeather && relatedRawLeather.length > 0 && (
        <section className="section-padding pt-0">
          <div className="container-wide">
            <h2 className="heading-subsection text-foreground mb-8">
              Explore Related Materials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedRawLeather.map((rl, index) => (
                <motion.div
                  key={rl._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link
                    href={`/catalog/raw-leather/${rl._id}`}
                    className="group block card-industrial"
                  >
                    <div className="w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden flex-shrink-0">
                      <img
                        src={rl.images?.[0] || "/placeholder-image.jpg"}
                        alt={rl.name}
                        className="w-full h-full object-cover object-center block transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="text-xs text-brass mb-2">{rl.leatherType}</p>
                          <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-leather transition-colors">
                            {rl.name}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {rl.isFeatured && (
                            <span className="text-[11px] uppercase tracking-wide px-2 py-1 border border-brass text-brass min-w-[92px] text-center">
                              Featured
                            </span>
                          )}
                          {rl.sampleAvailable && (
                            <span className="text-[11px] uppercase tracking-wide px-2 py-1 border border-border text-muted-foreground bg-muted/40 min-w-[92px] text-center">
                              Sample
                            </span>
                          )}
                          {rl.negotiable && (
                            <span className="text-[11px] uppercase tracking-wide px-2 py-1 border border-leather/40 text-leather min-w-[92px] text-center">
                              Negotiable
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                        <p>
                          <span className="text-foreground/80">Thickness:</span>{" "}
                          {rl.thickness}
                        </p>
                        <p>
                          <span className="text-foreground/80">Finish:</span>{" "}
                          {rl.finish}
                        </p>
                        <p>
                          <span className="text-foreground/80">MOQ:</span>{" "}
                          {rl.minOrderQuantity} sq ft
                        </p>
                        <p>
                          <span className="text-foreground/80">Price:</span>{" "}
                          <span className="inline-flex items-baseline gap-1">
                            <PriceDisplay usdAmount={rl.pricePerSqFt} />
                            <span>/ sq ft</span>
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {getRelatedTags(rl).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-secondary text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-leather group-hover:text-brass transition-colors">
                        View Details <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              aria-label="Close enlarged image"
              className="absolute right-2 top-2 z-30 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative h-[80vh] w-full overflow-hidden">
              <Image
                src={selectedImage}
                alt={`${rawLeather.name} enlarged view`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 90vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous enlarged image"
                  className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next enlarged image"
                  className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}