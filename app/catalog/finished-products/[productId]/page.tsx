// my-leather-platform/app/catalog/finished-products/[productId]/page.tsx
import { IProduct, Pagination } from "@/types/product";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

import ProductDetailContent from "@/components/product-details/ProductDetailContent";

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

async function resolveApiBaseUrl(): Promise<string> {
  const apiPath = process.env.NEXT_PUBLIC_BACKEND_API_URL || "/api";
  // Prefer same-origin so dev and prod both hit the local Next route handlers,
  // and we don't depend on a stale external NEXT_INTERNAL_BACKEND_BASE_URL.
  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const proto =
      headerList.get("x-forwarded-proto") ||
      (host && host.startsWith("localhost") ? "http" : "https");
    if (host) {
      return `${proto}://${host}${apiPath}`;
    }
  } catch {
    // headers() not available — fall back to env-configured base URL
  }
  const baseUrl = process.env.NEXT_INTERNAL_BACKEND_BASE_URL || "";
  return `${baseUrl.replace(/\/$/, "")}${apiPath}`;
}

async function getProduct(productId: string): Promise<IProduct | null> {
  try {
    const apiBase = await resolveApiBaseUrl();
    const fetchUrl = `${apiBase}/finished-products/${productId}`;
    const res = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      const errorData = await res.json();
      console.error(
        `Failed to fetch product ${productId} (Status: ${res.status}):`,
        errorData.message || res.statusText
      );
      throw new Error(
        `Failed to fetch product: ${errorData.message || res.statusText}`
      );
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

async function getRelatedProducts(
  currentProductType: string,
  excludeProductId: string,
  limit: number = 6
): Promise<IProduct[]> {
  try {
    const apiBase = await resolveApiBaseUrl();
    const fetchUrl = `${apiBase}/finished-products?productType=${currentProductType}&limit=${limit + 2}`;
    const res = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch related products (Status: ${res.status})`
      );
      return [];
    }

    const data: { data: IProduct[]; pagination: Pagination } = await res.json();
    return data.data.filter((p) => p._id !== excludeProductId).slice(0, limit);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

// Error boundary component
const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-background">
    <Header />
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Unable to Load Product
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/catalog/finished-products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Catalog
              </Link>
            </Button>
            <Button asChild>
              <Link href="/custom-manufacturing">
                Explore Custom Manufacturing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  return {
    title: `${product.name} - Premium Leather ${product.productType}`,
    description:
      product.description.length > 160
        ? product.description.substring(0, 157) + "..."
        : product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  try {
    const { productId } = await params;
    const product = await getProduct(productId);

    if (!product) {
      notFound();
    }

    const relatedProducts = await getRelatedProducts(product.productType, product._id, 4);

    return (
      <div className="min-h-screen bg-background">
        <Header />

        <ProductDetailContent
          product={product}
          relatedProducts={relatedProducts}
        />

        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error in ProductDetailPage:", error);
    return (
      <ErrorDisplay
        error="An unexpected error occurred while loading the product. Please try again later."
      />
    );
  }
}