"use client";

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  XCircle,
  Send,
  Truck,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  TrendingUp,
  Calendar,
  Users,
} from "lucide-react";
import axios from "axios"
import { format } from "date-fns"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { useRouter } from 'next/navigation'

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
import { IQuoteRequest } from '@/types/quote';
import { countries } from '@/lib/config/shippingConfig';

type SortKey = keyof IQuoteRequest;
type SortOrder = "asc" | "desc";

export default function AdminQuotesPage() {
  const router = useRouter();
  const [quoteRequests, setQuoteRequests] = useState<IQuoteRequest[]>([]);
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
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterItemType, setFilterItemType] = useState<string>("all");
  
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempFilterStatus, setTempFilterStatus] = useState("");
  const [tempFilterCountry, setTempFilterCountry] = useState("");
  const [tempFilterItemType, setTempFilterItemType] = useState("");
  const [onPopoverOpen, setOnPopoverOpen] = useState(false);

  const hasActiveFiltersOrNonDefaultSort = 
    filterStatus !== "all" || 
    filterCountry !== "all" || 
    filterItemType !== "all" ||
    searchTerm !== "" ||
    sortColumn !== 'createdAt' || 
    sortOrder !== "desc";

  const handleTempFilterChange = (key: string, value: string) => {
    if (key === "search") setTempSearchTerm(value);
    else if (key === "status") setTempFilterStatus(value);
    else if (key === "country") setTempFilterCountry(value);
    else if (key === "itemType") setTempFilterItemType(value);
  };

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setFilterStatus(tempFilterStatus);
    setFilterCountry(tempFilterCountry);
    setFilterItemType(tempFilterItemType);
    setCurrentPage(1);
    setOnPopoverOpen(false);
  };

  const handleClearFilters = () => {
    setTempSearchTerm("");
    setTempFilterStatus("all");
    setTempFilterCountry("all");
    setTempFilterItemType("all");
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCountry("all");
    setFilterItemType("all");
    setSortColumn('createdAt');
    setSortOrder("desc");
    setCurrentPage(1);
  };

  useEffect(() => {
    setTempSearchTerm(searchTerm);
    setTempFilterStatus(filterStatus);
    setTempFilterCountry(filterCountry);
    setTempFilterItemType(filterItemType);
  }, [searchTerm, filterStatus, filterCountry, filterItemType]);

  const requestedCount = quoteRequests.filter((r) => r.status === "requested").length;
  const approvedPaidCount = quoteRequests.filter((r) => r.status === "approved" || r.status === "paid").length;
  const rejectedCancelledCount = quoteRequests.filter((r) => r.status === "rejected" || r.status === "cancelled").length;

  const handleExportCSV = () => {
    if (quoteRequests.length === 0) {
      toast.error("No quote requests to export.");
      return;
    }

    const headers = [
      "Request Number",
      "Status",
      "Company Name",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Destination Country",
      "Item Name",
      "Item Type",
      "Quantity",
      "Quantity Unit",
      "Proposed Price Per Unit",
      "Proposed Total Price",
      "Created At",
    ];

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = quoteRequests.map((quote) => {
      const requestNumber = quote.requestNumber || String(quote._id || "").slice(-8);
      const createdAt = quote.createdAt ? format(new Date(quote.createdAt), "yyyy-MM-dd HH:mm:ss") : "";

      return [
        escapeCsv(requestNumber),
        escapeCsv(quote.status),
        escapeCsv(quote.companyName),
        escapeCsv(quote.customerName),
        escapeCsv(quote.customerEmail),
        escapeCsv(quote.customerPhone || ""),
        escapeCsv(quote.destinationCountry),
        escapeCsv(quote.itemName),
        escapeCsv(quote.itemTypeCategory),
        escapeCsv(quote.quantity),
        escapeCsv(quote.quantityUnit),
        escapeCsv(quote.proposedPricePerUnit ?? ""),
        escapeCsv(quote.proposedTotalPrice ?? ""),
        escapeCsv(createdAt),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quote_requests.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Quote requests exported to CSV.");
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchQuoteRequests = useCallback(async () => {
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
      if (filterCountry !== "all") {
        queryParams.append("destinationCountry", filterCountry);
      }
      if (filterItemType !== "all") {
        queryParams.append("itemTypeCategory", filterItemType);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests?${queryParams.toString()}`
      );

      if (response.data.success) {
        setQuoteRequests(response.data.data as IQuoteRequest[]);
        setTotalRequestsCount(response.data.pagination.totalProducts);
      } else {
        throw new Error(response.data.message || "Failed to fetch quote requests.");
      }
    } catch (err: any) {
      console.error("Error fetching quote requests:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load quote requests.");
      setQuoteRequests([]);
      setTotalRequestsCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortOrder, debouncedSearchTerm, filterStatus, filterCountry, filterItemType]);

  useEffect(() => {
    fetchQuoteRequests();
  }, [fetchQuoteRequests]);

  const getStatusBadge = (status: IQuoteRequest["status"]) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200"><Clock className="mr-1 h-3 w-3" /> Requested</Badge>;
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      case "paid":
        return <Badge className="bg-purple-600 hover:bg-purple-700"><DollarSign className="mr-1 h-3 w-3" /> Paid</Badge>;
      case "dispatched":
        return <Badge className="bg-indigo-600 hover:bg-indigo-700"><Truck className="mr-1 h-3 w-3" /> Dispatched</Badge>;
      case "cancelled":
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalRequestsCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // FIX: Allow sorting by requestNumber
  const handleSort = (column: SortKey | 'requestNumber') => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column); // Set new sort column
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // FIX: Update renderSortIcon to handle 'requestNumber'
  const renderSortIcon = (column: SortKey | 'requestNumber') => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
  };


  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Quote Requests
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and track customer quote requests and their lifecycle
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchQuoteRequests}>
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
                    <FileText className="h-4 w-4 text-blue-600" />
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
                      New / Requested
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {requestedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting review
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Approved / Paid
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {approvedPaidCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successfully processed
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Rejected / Cancelled
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {rejectedCancelledCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Not approved
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
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Country
                        </Label>
                        <Select
                          value={tempFilterCountry}
                          onValueChange={(val) =>
                            handleTempFilterChange("country", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Countries" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Item Type
                        </Label>
                        <Select
                          value={tempFilterItemType}
                          onValueChange={(val) =>
                            handleTempFilterChange("itemType", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="finished-product">Finished Product</SelectItem>
                            <SelectItem value="raw-leather">Leather Hides</SelectItem>
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
                        onClick={() => handleSort('customerName')}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Customer / Company
                        {renderSortIcon('customerName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('itemName')}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Item Details
                        {renderSortIcon('itemName')}
                      </Button>
                    </TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Status
                        {renderSortIcon('status')}
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
                  ) : quoteRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          No quote requests found.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    quoteRequests.map((request, index) => (
                      <TableRow
                        key={request._id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground">
                          <Link href={`/admin-ahmza/quotes/${request._id}`} className="hover:underline">
                            #{(currentPage - 1) * itemsPerPage + index + 1}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">{request.customerName}</p>
                            <p className="text-sm text-muted-foreground">{request.companyName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">{request.itemName}</p>
                            <p className="text-sm text-muted-foreground">{request.itemTypeCategory}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">{request.quantity} {request.quantityUnit}</TableCell>
                        <TableCell className="text-muted-foreground">{request.destinationCountry}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" asChild className="h-8">
                            <Link href={`/admin-ahmza/quotes/${request._id}`}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Link>
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