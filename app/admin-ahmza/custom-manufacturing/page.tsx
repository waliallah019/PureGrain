// my-leather-platform/app/admin/custom-manufacturing/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ICustomManufacturingRequest } from "@/lib/models/CustomManufacturingRequest";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter as FilterIcon,
  Download, // Keep Download icon
  Eye,
  Trash2,
  ArrowUpDown,
  Calendar,
  Users,
  TrendingUp,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { jsPDF } from "jspdf"; // For PDF export option (if needed, currently not used fully)
import "jspdf-autotable"; // For PDF export with table support

const requestStatuses = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "invoice_sent",
  "payment_pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "expired",
];

type SortKey =
  | "companyName"
  | "contactPerson"
  | "email"
  | "productType"
  | "estimatedQuantity"
  | "status"
  | "createdAt";
type SortOrder = "asc" | "desc";

export default function AdminCustomManufacturingPage() {
  const [requests, setRequests] = useState<ICustomManufacturingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRequestsCount, setTotalRequestsCount] = useState(0);

  const [sortColumn, setSortColumn] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Actual applied filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Temporary filter states for Popover inputs
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempFilterStatus, setTempFilterStatus] = useState("");

  // State for minimizing cards
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);

  // Helper to format column names for display (e.g., 'createdAt' -> 'Created At')
  const formatColumn = (col: string) =>
    col.replace(/([a-z])([A-Z])/g, "$1 $2");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());
      if (sortColumn) {
        queryParams.append("sortBy", sortColumn);
        queryParams.append("order", sortOrder);
      }
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (filterStatus) {
        queryParams.append("status", filterStatus);
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_API_URL
        }/custom-manufacturing?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch requests.");
      }

      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        console.error("Backend response 'data' field is not an array:", data);
        setRequests([]);
      }
      if (
        data.pagination &&
        typeof data.pagination.totalProducts === "number"
      ) {
        setTotalRequestsCount(data.pagination.totalProducts);
      } else {
        console.warn(
          "Backend response 'pagination.totalProducts' is missing or not a number:",
          data,
        );
        setTotalRequestsCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching requests:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error(`Error fetching requests: ${err.message}`);
      setRequests([]);
      setTotalRequestsCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    sortColumn,
    sortOrder,
    searchTerm,
    filterStatus,
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return; // Prevent invalid page numbers
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on new sort
  };

  const handleTempFilterChange = (filterName: string, value: string) => {
    const effectiveValue = value === "all" ? "" : value; // "all" option clears the filter

    switch (filterName) {
      case "search":
        setTempSearchTerm(value);
        break;
      case "status":
        setTempFilterStatus(effectiveValue);
        break;
      default:
        break;
    }
  };

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setFilterStatus(tempFilterStatus);
    setCurrentPage(1); // Reset to first page when filters are applied
  };

  // When popover opens, sync temp states with actual applied states
  const onPopoverOpen = (open: boolean) => {
    if (open) {
      setTempSearchTerm(searchTerm);
      setTempFilterStatus(filterStatus);
    }
  };

  const handleClearFilters = () => {
    // Clear actual filter states
    setSearchTerm("");
    setFilterStatus("");
    // Clear temporary filter states
    setTempSearchTerm("");
    setTempFilterStatus("");
    setCurrentPage(1);
    setSortColumn("createdAt"); // Reset sort to default
    setSortOrder("desc"); // Reset sort order to default
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/custom-manufacturing/${requestId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete request.");
      }
      toast.success("Request deleted successfully!");
      fetchRequests(); // Re-fetch requests to update the list
    } catch (err: any) {
      console.error("Error deleting request:", err);
      toast.error(`Error deleting request: ${err.message}`);
    }
  };

  // --- NEW: Export Functionality ---
  const handleExportCSV = () => {
    if (requests.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const headers = [
      "Company Name",
      "Contact Person",
      "Email",
      "Phone",
      "Product Type",
      "Estimated Quantity",
      "Preferred Material",
      "Colors",
      "Timeline",
      "Budget Range",
      "Specifications",
      "Design Files",
      "Status",
      "Created At",
    ];

    // Map requests to an array of arrays (CSV rows)
    const csvRows = requests.map((req) => [
      `"${req.companyName.replace(/"/g, '""')}"`, // Handle quotes
      `"${req.contactPerson.replace(/"/g, '""')}"`,
      `"${req.email.replace(/"/g, '""')}"`,
      `"${(req.phone || "").replace(/"/g, '""')}"`,
      `"${req.productType.replace(/"/g, '""')}"`,
      req.estimatedQuantity,
      `"${(req.preferredMaterial || "").replace(/"/g, '""')}"`,
      `"${(req.colors || "").replace(/"/g, '""')}"`,
      `"${(req.timeline || "").replace(/"/g, '""')}"`,
      `"${(req.budgetRange || "").replace(/"/g, '""')}"`,
      `"${(req.specifications || "").replace(/"/g, '""')}"`,
      `"${(req.designFiles || []).join(', ').replace(/"/g, '""')}"`, // Join multiple files
      `"${req.status.replace(/"/g, '""')}"`,
      format(new Date(req.createdAt), "yyyy-MM-dd HH:mm:ss"),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Create a Blob and initiate download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "custom_manufacturing_requests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
    toast.success("Requests exported to CSV!");
  };

  const totalPages = Math.ceil(totalRequestsCount / itemsPerPage);

  // Helper for status badge styling (adjust as needed for theme)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
      case "submitted":
      case "requested":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-300 dark:border-yellow-700";
      case "Reviewed":
      case "under_review":
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:border-blue-700";
      case "Contacted":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-800/20 dark:text-red-300 dark:border-red-700";
      case "invoice_sent":
      case "payment_pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-800/20 dark:text-amber-300 dark:border-amber-700";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-800/20 dark:text-green-300 dark:border-green-700";
      case "processing":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300 dark:border-indigo-700";
      case "dispatched":
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300 dark:border-indigo-700";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-800/20 dark:text-emerald-300 dark:border-emerald-700";
      case "cancelled":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-300 dark:border-orange-700";
      case "expired":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-700";
      case "Archived":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  // Determine if filters or non-default sort are active for filter badge
  const isDefaultSort = sortColumn === "createdAt" && sortOrder === "desc";
  const hasActiveFiltersOrNonDefaultSort =
    searchTerm !== "" || filterStatus !== "" || !isDefaultSort;

  // Calculate stats (only based on currently fetched requests, for a more accurate count across pages, you might need dedicated API endpoints for counts)
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const completedCount = requests.filter((r) => r.status === "Completed").length;
  const totalQuantity = requests.reduce(
    (sum, r) => sum + (parseInt(r.estimatedQuantity) || 0),
    0,
  );

  // Render sort icon based on current sort state
  const renderSortIcon = (column: SortKey) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronDown className="ml-2 h-4 w-4" />
      );
    }
    return (
      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Custom Manufacturing Requests
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and track custom manufacturing requests
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchRequests}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              {" "}
              {/* CSV Export Button */}
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {/* You could add a DropdownMenu here for CSV/PDF if needed */}
          </div>
        </div>

        {/* Stats Cards Section */}
        <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
            <CardTitle className="text-xl font-semibold text-foreground">
              Request Overview
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsStatsMinimized(!isStatsMinimized)}
            >
              {isStatsMinimized ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          </CardHeader>
          {!isStatsMinimized && (
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Requests
                    </CardTitle>
                    <Package className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {totalRequestsCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      All time requests
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Review
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {pendingCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting action
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Completed
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {completedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successfully processed
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Quantity
                    </CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {totalQuantity.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Units requested (on current page)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Main Content Card (Table) */}
        <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full max-w-xl flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies, contacts, emails..."
                    value={tempSearchTerm}
                    onChange={(e) =>
                      handleTempFilterChange("search", e.target.value)
                    }
                    className="pl-9 pr-4 w-full"
                  />
                </div>

                {/* Filters Popover - Moved closer to search bar */}
                <Popover onOpenChange={onPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="shrink-0">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      Filters
                      {hasActiveFiltersOrNonDefaultSort && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Filter Requests
                      </h3>
                      {hasActiveFiltersOrNonDefaultSort && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Status
                        </Label>
                        <Select
                          value={tempFilterStatus}
                          onValueChange={(val) =>
                            handleTempFilterChange("status", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {requestStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={handleApplyFilters} className="w-full">
                      Apply Filters
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("companyName")}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Company
                        {renderSortIcon("companyName")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("contactPerson")}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Contact Person
                        {renderSortIcon("contactPerson")}
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("status")}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Status
                        {renderSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("createdAt")}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Date
                        {renderSortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                          <div
                            className="w-4 h-4 bg-primary rounded-full animate-pulse"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-4 h-4 bg-primary rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <span className="ml-2 text-muted-foreground">
                            Loading requests...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="text-destructive font-medium">
                          {error}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          No custom requests found.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <TableRow
                        key={request._id as string}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground">
                          {request.companyName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.contactPerson}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.productType}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {parseInt(request.estimatedQuantity).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                              size="sm"
                              asChild
                              className="h-8"
                              >
                              <Link href={`/admin-ahmza/custom-manufacturing/${request._id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                              </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(request._id as string)}
                              className="h-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                              >
                              <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-card/90 backdrop-blur-sm rounded-lg p-6 shadow-sm border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                totalRequestsCount,
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, totalRequestsCount)} of{" "}
              {totalRequestsCount} results
            </span>
          </div>

          <Pagination className="justify-end w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) =>
                  totalPages <= 7 ||
                  (page >= currentPage - 2 && page <= currentPage + 2) ||
                  page === 1 ||
                  page === totalPages ? (
                    <PaginationItem
                      key={page}
                      className="hidden sm:inline-flex"
                    >
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ) : page === currentPage - 3 || page === currentPage + 3 ? (
                    <PaginationItem
                      key={page}
                      className="hidden sm:inline-flex"
                    >
                      <span className="px-4 py-2 text-sm text-muted-foreground">
                        ...
                      </span>
                    </PaginationItem>
                  ) : null,
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages || totalPages === 0
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}