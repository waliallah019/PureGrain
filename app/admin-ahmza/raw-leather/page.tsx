'use client';

import RawLeatherList from "@/components/RawLeatherList";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Admin Raw Leather Page
 *
 * Renders RawLeatherList with empty initial data and lets it own the fetch.
 * A previous version of this page did its own initial fetch here to avoid an
 * empty first paint, but that fetch didn't pass `includeArchived`, so it
 * silently returned only Active hides (a handful) while RawLeatherList's own
 * fetch (which defaults to showing everything) returned the true count. When
 * both landed, whichever resolved last won — an intermittent mismatch where
 * the page could settle on the wrong, much smaller count. Since
 * RawLeatherList already fetches correctly on mount regardless of what it's
 * given, having a second, independently-filtered fetch here was redundant
 * and unsafe.
 */
export default function AdminRawLeatherPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leather Hides Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <RawLeatherList
            initialRawLeatherData={[]}
            initialTotalRawLeatherCount={0}
            initialRawLeatherTypes={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
