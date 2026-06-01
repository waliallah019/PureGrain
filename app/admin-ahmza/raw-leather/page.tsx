'use client';

import { useEffect, useState } from 'react';
import { IRawLeather, IRawLeatherType, Pagination } from "@/types/rawLeather"; // Import IRawLeatherType
import RawLeatherList from "@/components/RawLeatherList";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Corrected return type: Always include 'error: string | null'
async function getInitialRawLeatherData(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = '',
  sortBy: string = '',
  order: string = 'desc'
): Promise<{ rawLeather: IRawLeather[]; totalCount: number; error: string | null }> {
  const apiPath = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!apiPath) {
    console.error("NEXT_PUBLIC_BACKEND_API_URL environment variable is not set.");
    return { rawLeather: [], totalCount: 0, error: "API URL not configured." };
  }

  try {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (searchTerm) {
        queryParams.append("search", searchTerm);
    }
    if (sortBy) {
        queryParams.append("sortBy", sortBy);
        queryParams.append("order", order);
    }

    const fetchUrl = `${apiPath}/raw-leather?${queryParams.toString()}`;

    const res = await fetch(fetchUrl, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      console.error(
        `Failed to fetch leather hides from API (Status: ${res.status}):`,
        errorData.message
      );
      return { rawLeather: [], totalCount: 0, error: errorData.message || res.statusText };
    }

    const data = await res.json();
    if (!data.success) {
      console.error("Backend reported success: false. Message:", data.message);
      return { rawLeather: [], totalCount: 0, error: data.message || "Backend operation reported failure." };
    }

    if (!Array.isArray(data.data) ||
        typeof data.pagination !== 'object' ||
        data.pagination === null ||
        !('totalProducts' in data.pagination))
    {
      console.error("API response structure is unexpected:", data);
      return { rawLeather: [], totalCount: 0, error: "Invalid API response structure." };
    }

    return { rawLeather: data.data, totalCount: data.pagination.totalProducts, error: null };
  } catch (error: any) {
    console.error("Error fetching leather hides on page component:", error);
    return { rawLeather: [], totalCount: 0, error: error.message || "An unexpected error occurred." };
  }
}

// NEW: Function to fetch initial leather hides types
async function getInitialRawLeatherTypes(): Promise<{ types: IRawLeatherType[]; error: string | null }> {
  const apiPath = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!apiPath) {
    console.error("NEXT_PUBLIC_BACKEND_API_URL environment variable is not set.");
    return { types: [], error: "API URL not configured." };
  }

  try {
    const fetchUrl = `${apiPath}/raw-leather-types`;
    const res = await fetch(fetchUrl, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      console.error(
        `Failed to fetch leather hides types from API (Status: ${res.status}):`,
        errorData.message
      );
      return { types: [], error: errorData.message || res.statusText };
    }

    const data = await res.json();
    if (!data.success) {
      console.error("Backend reported success: false for leather hides types. Message:", data.message);
      return { types: [], error: data.message || "Backend operation reported failure for types." };
    }

    if (!Array.isArray(data.data)) {
      console.error("API response structure for leather hides types is unexpected:", data);
      return { types: [], error: "Invalid API response structure for types." };
    }

    return { types: data.data, error: null };
  } catch (error: any) {
    console.error("Error fetching leather hides types on page component:", error);
    return { types: [], error: error.message || "An unexpected error occurred while fetching types." };
  }
}


export default function AdminRawLeatherPage() {
  const [initialRawLeatherData, setInitialRawLeatherData] = useState<{ rawLeather: IRawLeather[], totalCount: number, error: string | null }>({
    rawLeather: [],
    totalCount: 0,
    error: null
  });
  const [initialRawLeatherTypes, setInitialRawLeatherTypes] = useState<{ types: IRawLeatherType[], error: string | null }>({
    types: [],
    error: null
  });
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingInitial(true);
      const [rawLeatherResult, rawLeatherTypesResult] = await Promise.all([
        getInitialRawLeatherData(1, 10),
        getInitialRawLeatherTypes()
      ]);

      setInitialRawLeatherData(rawLeatherResult);
      setInitialRawLeatherTypes(rawLeatherTypesResult);
      setIsLoadingInitial(false);
    };
    loadData();
  }, []);

  if (isLoadingInitial) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Leather Hides Inventory</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-center">Loading initial leather hides data...</p></CardContent>
        </Card>
      </div>
    );
  }

  // Combine errors for a single display
  const combinedError = initialRawLeatherData.error || initialRawLeatherTypes.error;

  if (combinedError) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive-foreground">
          <p className="font-semibold text-lg">Error loading initial data:</p>
          <p>{combinedError}</p>
          <p className="text-sm mt-2">Please check console for more details and ensure backend is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leather Hides Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <RawLeatherList
            initialRawLeatherData={initialRawLeatherData.rawLeather}
            initialTotalRawLeatherCount={initialRawLeatherData.totalCount}
            initialRawLeatherTypes={initialRawLeatherTypes.types} // Pass product types here
          />
        </CardContent>
      </Card>
    </div>
  );
}