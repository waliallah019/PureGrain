"use client";

import ProductList from "@/components/ProductList";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Admin Products Page
 *
 * Renders ProductList with empty initial data and lets it own the fetch.
 * A previous version of this page did its own initial fetch here to avoid an
 * empty first paint, but that fetch didn't pass `includeArchived`, so it
 * silently returned only Active products (a handful) while ProductList's own
 * fetch (which defaults to showing everything) returned the true count. When
 * both landed, whichever resolved last won — an intermittent mismatch where
 * the page could settle on the wrong, much smaller count. Since ProductList
 * already fetches correctly on mount regardless of what it's given, having a
 * second, independently-filtered fetch here was redundant and unsafe.
 */
export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
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
            initialProducts={[]}
            totalProductsCount={0}
            initialProductTypes={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
