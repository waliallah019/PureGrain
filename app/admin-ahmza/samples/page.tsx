"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Filter as FilterIcon,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ISampleRequest, PaymentStatus } from '@/lib/models/sampleRequestModel';
import Link from 'next/link';

type SortKey = keyof ISampleRequest;
type SortOrder = "asc" | "desc";

export default function SamplesPage() {
  const router = useRouter();
  const [sampleRequests, setSampleRequests] = useState<ISampleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRequestsCount, setTotalRequestsCount] = useState(0);

  const [sortColumn, setSortColumn] = useState<SortKey | null>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSampleType, setFilterSampleType] = useState<string>("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchSampleRequests = useCallback(async () => {
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
      if (debouncedSearchTerm) {
        queryParams.append("search", debouncedSearchTerm);
      }
      if (filterStatus !== "all") {
        queryParams.append("status", filterStatus);
      }
      if (filterSampleType !== "all") {
        queryParams.append("sampleType", filterSampleType);
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/sample-requests?${queryParams.toString()}`;
      console.log("[FE-List] Fetching sample requests from API:", apiUrl);
      const response = await axios.get(apiUrl);

      if (response.data.success) {
        setSampleRequests(response.data.data as ISampleRequest[]);
        setTotalRequestsCount(response.data.pagination.totalProducts);
        console.log("[FE-List] Sample requests fetched successfully.");
      } else {
        throw new Error(response.data.message || "Failed to fetch sample requests.");
      }
    } catch (err: any) {
      console.error("[FE-List] Error fetching sample requests:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load sample requests.");
      setSampleRequests([]);
      setTotalRequestsCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortOrder, debouncedSearchTerm, filterStatus, filterSampleType]);

  useEffect(() => {
    fetchSampleRequests();
  }, [fetchSampleRequests]);


  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending Payment
          </Badge>
        );
      case "paid":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white">
            <Package className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <Truck className="mr-1 h-3 w-3" />
            Shipped
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-indigo-600 hover:bg-indigo-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">
            <XCircle className="mr-1 h-3 w-3" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{(status as string).charAt(0).toUpperCase() + (status as string).slice(1)}</Badge>;
    }
  };

  const handleViewDetails = (requestId: string) => {
    router.push(`/admin-ahmza/samples/${requestId}`);
  };

  const totalPages = Math.ceil(totalRequestsCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    console.log("[FE-List] Changing page to:", page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    console.log("[FE-List] Changing items per page to:", value);
  };

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
    console.log(`[FE-List] Sorting by ${column}, order ${sortOrder}.`);
  };

  const renderSortIcon = (column: SortKey) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
  };

  const [isStatsMinimized, setIsStatsMinimized] = useState(false);
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempFilterStatus, setTempFilterStatus] = useState("");
  const [tempFilterSampleType, setTempFilterSampleType] = useState("");
  const [onPopoverOpen, setOnPopoverOpen] = useState(false);

  const hasActiveFiltersOrNonDefaultSort = 
    filterStatus !== "all" || 
    filterSampleType !== "all" || 
    searchTerm !== "" ||
    sortColumn !== 'createdAt' || 
    sortOrder !== "desc";

  const handleTempFilterChange = (key: string, value: string) => {
    if (key === "search") setTempSearchTerm(value);
    else if (key === "status") setTempFilterStatus(value);
    else if (key === "sampleType") setTempFilterSampleType(value);
  };

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setFilterStatus(tempFilterStatus);
    setFilterSampleType(tempFilterSampleType);
    setCurrentPage(1);
    setOnPopoverOpen(false);
  };

  const handleClearFilters = () => {
    setTempSearchTerm("");
    setTempFilterStatus("all");
    setTempFilterSampleType("all");
    setSearchTerm("");
    setFilterStatus("all");
    setFilterSampleType("all");
    setSortColumn('createdAt');
    setSortOrder("desc");
    setCurrentPage(1);
  };

  useEffect(() => {
    setTempSearchTerm(searchTerm);
    setTempFilterStatus(filterStatus);
    setTempFilterSampleType(filterSampleType);
  }, [searchTerm, filterStatus, filterSampleType]);

  const pendingCount = sampleRequests.filter((r) => r.paymentStatus === "pending").length;
  const processingShippedCount = sampleRequests.filter((r) => r.paymentStatus === "processing" || r.paymentStatus === "shipped").length;
  const deliveredCount = sampleRequests.filter((r) => r.paymentStatus === "delivered").length;

  const handleExportCSV = () => {
    if (sampleRequests.length === 0) {
      toast.error("No sample requests to export.");
      return;
    }

    const headers = [
      "Request Number",
      "Company Name",
      "Contact Person",
      "Email",
      "Phone",
      "Country",
      "Sample Type",
      "Quantity",
      "Quantity Unit",
      "Payment Status",
      "Shipping Fee",
      "Tracking Number",
      "Created At",
    ];

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = sampleRequests.map((request) => {
      const requestNumber = request.requestNumber || String(request._id || "").slice(-8);
      const companyName = (request as any).companyName || "";
      const contactPerson = (request as any).contactPerson || (request as any).customerName || "";
      const email = (request as any).email || (request as any).customerEmail || "";
      const phone = (request as any).phone || (request as any).customerPhone || "";
      const country = (request as any).country || (request as any).destinationCountry || "";
      const sampleType = (request as any).sampleType || (request as any).itemName || "";
      const quantity = (request as any).quantity ?? "";
      const quantityUnit = (request as any).quantityUnit || "";
      const paymentStatus = request.paymentStatus || "";
      const shippingFee = Number((request as any).shippingFee || 0).toFixed(2);
      const trackingNumber = (request as any).trackingNumber || "";
      const createdAt = request.createdAt ? format(new Date(request.createdAt), "yyyy-MM-dd HH:mm:ss") : "";

      return [
        escapeCsv(requestNumber),
        escapeCsv(companyName),
        escapeCsv(contactPerson),
        escapeCsv(email),
        escapeCsv(phone),
        escapeCsv(country),
        escapeCsv(sampleType),
        escapeCsv(quantity),
        escapeCsv(quantityUnit),
        escapeCsv(paymentStatus),
        escapeCsv(shippingFee),
        escapeCsv(trackingNumber),
        escapeCsv(createdAt),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_requests.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Sample requests exported to CSV.");
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Sample Requests
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and track customer sample requests and shipments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchSampleRequests}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
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
                      Pending Payment
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {pendingCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting payment
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Processing & Shipped
                    </CardTitle>
                    <Truck className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {processingShippedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      In progress
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Delivered
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {deliveredCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successfully delivered
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

                {/* Filters Popover */}
                <Popover onOpenChange={setOnPopoverOpen}>
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Sample Type
                        </Label>
                        <Select
                          value={tempFilterSampleType}
                          onValueChange={(val) =>
                            handleTempFilterChange("sampleType", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Sample Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sample Types</SelectItem>
                            <SelectItem value="raw-leather">Leather Hides</SelectItem>
                            <SelectItem value="finished-products">Finished Products</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
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
                      <span className="px-2">#</span>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('contactPerson')}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Customer / Company
                        {renderSortIcon('contactPerson')}
                      </Button>
                    </TableHead>
                    <TableHead>Sample Details</TableHead>
                    <TableHead>Shipping Address</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('paymentStatus')}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Status
                        {renderSortIcon('paymentStatus')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('createdAt')}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Request Date
                        {renderSortIcon('createdAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
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
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="text-destructive font-medium">
                          {error}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sampleRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          No sample requests found.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sampleRequests.map((request, index) => (
                      <TableRow
                        key={request._id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground">
                          #{(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">{request.contactPerson}</p>
                            <p className="text-sm text-muted-foreground">{request.companyName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">{request.productName || request.sampleType}</p>
                            <p className="text-sm text-muted-foreground">{request.productTypeCategory || request.materialPreference || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{request.address}</TableCell>
                        <TableCell>{getStatusBadge(request.paymentStatus)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewDetails(request._id)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
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