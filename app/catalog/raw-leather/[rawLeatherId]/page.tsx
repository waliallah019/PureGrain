import { IRawLeather, Pagination } from "@/types/rawLeather";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import RawLeatherDetailContent from "@/components/raw-leather-details/RawLeatherDetailContent"; // Client Component for interactive content
import { headers } from "next/headers";
import { notFound } from "next/navigation"; // For 404 handling
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

interface RawLeatherDetailPageProps {
  params: Promise<{
    rawLeatherId: string; // The dynamic segment from the URL
  }>;
}

async function resolveApiBaseUrl(): Promise<string> {
  const apiPath = process.env.NEXT_PUBLIC_BACKEND_API_URL || "/api";
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
    // headers() unavailable — fall back to env-configured base URL
  }
  const baseUrl = process.env.NEXT_INTERNAL_BACKEND_BASE_URL || "";
  return `${baseUrl.replace(/\/$/, "")}${apiPath}`;
}

async function getRawLeather(rawLeatherId: string): Promise<IRawLeather | null> {
  try {
    const apiBase = await resolveApiBaseUrl();
    const fetchUrl = `${apiBase}/raw-leather/${rawLeatherId}`;
    const res = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null; // Raw leather not found
      }
      const errorData = await res.json();
      console.error(
        `Failed to fetch raw leather ${rawLeatherId} (Status: ${res.status}):`,
        errorData.message || res.statusText
      );
      throw new Error(`Failed to fetch raw leather: ${errorData.message || res.statusText}`);
    }

    const data = await res.json();
    return data.data; // The API returns { success: true, data: rawLeather }
  } catch (error) {
    console.error(`Error fetching raw leather ${rawLeatherId}:`, error);
    return null;
  }
}

/**
 * Per-hide title, description, canonical and Open Graph.
 *
 * These pages previously had no metadata at all, so every hide in the catalogue
 * inherited the root layout's title and description — hundreds of URLs sharing
 * one title, which is the duplicate-title problem the audit flagged on /contact
 * and /catalog, at much larger scale. The finished-products detail route already
 * had `generateMetadata`; this brings raw leather in line.
 */
export async function generateMetadata({
  params,
}: RawLeatherDetailPageProps): Promise<Metadata> {
  const { rawLeatherId } = await params;
  const hide = await getRawLeather(rawLeatherId);

  if (!hide) {
    return {
      title: "Leather Hide Not Found",
      description: "The requested leather hide could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const specs = [hide.leatherType, hide.finish, hide.thickness].filter(Boolean).join(", ");
  const description =
    hide.description?.trim() ||
    `${hide.name} — ${specs}. Wholesale ${hide.animal ?? ""} leather hide from Pure Grain Exports, MOQ ${hide.minOrderQuantity} sq ft, with samples and full export documentation.`.replace(
      /\s+/g,
      " "
    );

  return pageMetadata({
    title: `${hide.name} — ${hide.leatherType} Leather Hide`,
    description: description.slice(0, 300),
    path: `/catalog/raw-leather/${rawLeatherId}`,
    image: hide.images?.[0] || undefined,
    imageAlt: hide.name,
    keywords: [hide.leatherType, hide.animal, hide.finish, "leather hide wholesale"].filter(
      (k): k is string => Boolean(k)
    ),
  });
}

// Function to get related raw leather
async function getRelatedRawLeather(
  currentLeatherType: string,
  excludeRawLeatherId: string,
  limit: number = 4
): Promise<IRawLeather[]> {
  try {
    const apiBase = await resolveApiBaseUrl();
    const fetchUrl = `${apiBase}/raw-leather?leatherType=${currentLeatherType}&limit=${limit}`;
    const res = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Failed to fetch related raw leather (Status: ${res.status})`);
      return [];
    }

    const data: { data: IRawLeather[]; pagination: Pagination } = await res.json();
    return data.data.filter((rl) => rl._id !== excludeRawLeatherId).slice(0, limit);
  } catch (error) {
    console.error("Error fetching related raw leather:", error);
    return [];
  }
}

export default async function RawLeatherDetailPage({ params }: RawLeatherDetailPageProps) {
  const { rawLeatherId } = await params;
  const rawLeather = await getRawLeather(rawLeatherId);

  if (!rawLeather) {
    notFound(); // Next.js built-in 404 handling
  }

  const relatedRawLeather = await getRelatedRawLeather(rawLeather.leatherType, rawLeather._id);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <RawLeatherDetailContent rawLeather={rawLeather} relatedRawLeather={relatedRawLeather} />

      <Footer />
    </div>
  );
}