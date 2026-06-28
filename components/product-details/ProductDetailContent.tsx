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
import { IProduct } from "@/types/product";
import PriceDisplay from "@/components/PriceDisplay";

interface ProductDetailContentProps {
  product: IProduct;
  relatedProducts: IProduct[];
}

export default function ProductDetailContent({
  product,
  relatedProducts,
}: ProductDetailContentProps) {
  const primaryImage = product.images?.[0] || "/placeholder-image.jpg";
  const images = product.images && product.images.length > 0 ? product.images : [primaryImage];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const selectedImage = images[selectedIndex] || primaryImage;

  const featureItems = useMemo(() => {
    const items = [
      `Product type: ${product.productType}`,
      `Material: ${product.materialUsed}`,
      `Dimensions: ${product.dimensions}`,
      `MOQ: ${product.moq} units`,
      product.sampleAvailable ? "Sample requests available" : null,
      product.availability ? `Availability: ${product.availability}` : null,
    ].filter(Boolean) as string[];

    return items;
  }, [product]);

  const chipItems = useMemo(() => {
    if (product.colorVariants && product.colorVariants.length > 0) {
      return product.colorVariants;
    }

    return (product.tags || []).filter(Boolean);
  }, [product]);

  const specifications = useMemo(() => {
    const specs = [
      { label: "Product Type", value: product.productType },
      { label: "Material", value: product.materialUsed },
      { label: "Dimensions", value: product.dimensions },
      { label: "MOQ", value: `${product.moq} units` },
      { label: "Availability", value: product.availability },
    ].filter(Boolean) as { label: string; value: string }[];

    if (product.tags && product.tags.length > 0) {
      specs.push({
        label: "Tags",
        value: product.tags.join(", "),
      });
    }

    return specs;
  }, [product]);

  const getRelatedTags = (item: IProduct) => {
    const baseTags = (item.tags || []).filter(Boolean);
    const fallbackTags = (item.colorVariants || []).filter(Boolean);
    const merged = baseTags.length > 0 ? baseTags : fallbackTags;
    return Array.from(new Set(merged)).slice(0, 2);
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
            href="/catalog/finished-products"
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
                  alt={product.name}
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
                        alt={`${product.name} thumbnail`}
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
              <p className="text-label text-brass mb-4">{product.productType}</p>
              <h1 className="heading-section text-foreground mb-6">
                {product.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {product.sampleAvailable && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs">
                    <ShoppingCart className="h-3 w-3" /> Sample Available
                  </span>
                )}
                {product.availability && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs">
                    {product.availability}
                  </span>
                )}
                {product.isFeatured && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
              <div className="mb-6 text-lg text-foreground">
                <span className="text-foreground/70">Price:</span>{" "}
                <span className="font-semibold inline-flex items-baseline gap-1">
                  <PriceDisplay usdAmount={product.pricePerUnit} showOriginal />
                  <span>/ {product.priceUnit}</span>
                </span>
              </div>
              <div className="divider-brass mb-6" />
              <p className="text-body mb-8">{product.description}</p>

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
                {product.sampleAvailable && (
                  <Link
                    href={`/sample-request/review?productId=${product._id}&productTypeCategory=finished-product`}
                    className="btn-brass w-full sm:w-auto justify-center"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Request a Sample
                  </Link>
                )}
                <Link
                  href={`/quote-request?itemId=${product._id}&itemName=${encodeURIComponent(product.name)}&itemTypeCategory=finished-product`}
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

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="section-padding pt-0">
          <div className="container-wide">
            <h2 className="heading-subsection text-foreground mb-8">
              Explore Related Materials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link
                  key={p._id}
                  href={`/catalog/finished-products/${p._id}`}
                  className="group block card-industrial"
                >
                  <div className="w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden flex-shrink-0">
                    <Image
                      src={p.images?.[0] || "/placeholder-image.jpg"}
                      alt={p.name}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover object-center block transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-xs text-brass mb-2">{p.productType}</p>
                        <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-leather transition-colors">
                          {p.name}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {p.isFeatured && (
                          <span className="text-[11px] uppercase tracking-wide px-2 py-1 border border-brass text-brass min-w-[92px] text-center">
                            Featured
                          </span>
                        )}
                        {p.sampleAvailable && (
                          <span className="text-[11px] uppercase tracking-wide px-2 py-1 border border-border text-muted-foreground bg-muted/40 min-w-[92px] text-center">
                            Sample
                          </span>
                        )}
                        {p.availability && (
                          <span className="text-[11px] uppercase tracking-wide px-2 py-1 border border-leather/40 text-leather min-w-[92px] text-center">
                            {p.availability}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      <p>
                        <span className="text-foreground/80">Material:</span>{" "}
                        {p.materialUsed}
                      </p>
                      <p>
                        <span className="text-foreground/80">Type:</span>{" "}
                        {p.productType}
                      </p>
                      <p>
                        <span className="text-foreground/80">MOQ:</span>{" "}
                        {p.moq} units
                      </p>
                      <p>
                        <span className="text-foreground/80">Price:</span>{" "}
                        <span className="inline-flex items-baseline gap-1">
                          <PriceDisplay usdAmount={p.pricePerUnit} />
                          <span>/ {p.priceUnit}</span>
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {getRelatedTags(p).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase tracking-wide px-2 py-0.5 border border-border/70 text-muted-foreground"
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
                alt={`${product.name} enlarged view`}
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