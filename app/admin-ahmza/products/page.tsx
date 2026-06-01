export const dynamic = "force-dynamic";

import { IProduct, Pagination as ProductPagination, IProductType } from "@/types/product";
import ProductList from "@/components/ProductList";
import { Toaster } from "react-hot-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/**
 * Fetches product data from the Next.js API route.
 * This function runs on the server (Server Component).
 * It always returns a safe structure.
 */
async function getProducts(
  page: number = 1,
  limit: number = 10,
): Promise<{ products: IProduct[]; pagination: ProductPagination }> {
  const baseUrl = process.env.NEXT_INTERNAL_BACKEND_BASE_URL;
  const apiPath = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const effectiveBaseUrl = baseUrl || "https://pure-grain-three.vercel.app";
  const effectiveApiPath = apiPath || "/api";

  const defaultPagination: ProductPagination = {
    currentPage: page,
    totalPages: 0,
    limit,
    totalProducts: 0,
  };

  try {
    const fetchUrl = `${effectiveBaseUrl}${effectiveApiPath}/finished-products?page=${page}&limit=${limit}`;
    const res = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error("Failed to fetch products:", errorData);
      return { products: [], pagination: defaultPagination };
    }

    const data = await res.json();

    if (
      !data?.success ||
      !Array.isArray(data.data) ||
      typeof data.pagination !== "object" ||
      data.pagination === null ||
      !("totalProducts" in data.pagination)
    ) {
      console.error("Unexpected products API response:", data);
      return { products: [], pagination: defaultPagination };
    }

    return { products: data.data, pagination: data.pagination };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], pagination: defaultPagination };
  }
}

/**
 * Fetches product types from the Next.js API route.
 */
async function getProductTypes(): Promise<IProductType[]> {
  const baseUrl = process.env.NEXT_INTERNAL_BACKEND_BASE_URL;
  const apiPath = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const effectiveBaseUrl = baseUrl || "https://pure-grain-three.vercel.app";
  const effectiveApiPath = apiPath || "/api";

  try {
    const fetchUrl = `${effectiveBaseUrl}${effectiveApiPath}/product-types`;
    const res = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error("Failed to fetch product types:", errorData);
      return [];
    }

    const data = await res.json();

    if (!data?.success || !Array.isArray(data.data)) {
      console.error("Unexpected product types API response:", data);
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching product types:", error);
    return [];
  }
}

/**
 * Admin Products Page (Server Component)
 */
export default async function AdminProductsPage() {
  const productsData = await getProducts();
  const productTypesData = await getProductTypes();

  return (
    <div className="space-y-6">
      {/* Keep Toaster here only if not already placed in layout.tsx */}
      {/* <Toaster /> */}

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>
            Manage your finished product inventory, including filtering,
            sorting, and CRUD operations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ProductList
            initialProducts={productsData.products}
            totalProductsCount={productsData.pagination.totalProducts}
            initialProductTypes={productTypesData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
