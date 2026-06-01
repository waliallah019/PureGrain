// my-leather-platform/app/admin/messages/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, MessageSquare, Reply, Archive, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Filter as FilterIcon, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Download } from "lucide-react"
import { toast } from "react-hot-toast"
import axios from "axios"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Separator } from "@/components/ui/separator";

interface Message {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCountry?: string;
  inquiryType: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

type SortKey = keyof Message;
type SortOrder = "asc" | "desc";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);

  const [sortColumn, setSortColumn] = useState<SortKey | null>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  // FIX: Change initial values to "all" (a non-empty string)
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  
  const [isStatsMinimized, setIsStatsMinimized] = useState(false);
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempFilterStatus, setTempFilterStatus] = useState("");
  const [tempFilterPriority, setTempFilterPriority] = useState("");
  const [tempFilterCategory, setTempFilterCategory] = useState("");
  const [onPopoverOpen, setOnPopoverOpen] = useState(false);

  const hasActiveFiltersOrNonDefaultSort = 
    filterStatus !== "all" || 
    filterPriority !== "all" || 
    filterCategory !== "all" ||
    searchTerm !== "" ||
    sortColumn !== 'createdAt' || 
    sortOrder !== "desc";

  const handleTempFilterChange = (key: string, value: string) => {
    if (key === "search") setTempSearchTerm(value);
    else if (key === "status") setTempFilterStatus(value);
    else if (key === "priority") setTempFilterPriority(value);
    else if (key === "category") setTempFilterCategory(value);
  };

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setFilterStatus(tempFilterStatus);
    setFilterPriority(tempFilterPriority);
    setFilterCategory(tempFilterCategory);
    setCurrentPage(1);
    setOnPopoverOpen(false);
  };

  const handleClearFilters = () => {
    setTempSearchTerm("");
    setTempFilterStatus("all");
    setTempFilterPriority("all");
    setTempFilterCategory("all");
    setSearchTerm("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterCategory("all");
    setSortColumn('createdAt');
    setSortOrder("desc");
    setCurrentPage(1);
  };

  useEffect(() => {
    setTempSearchTerm(searchTerm);
    setTempFilterStatus(filterStatus);
    setTempFilterPriority(filterPriority);
    setTempFilterCategory(filterCategory);
  }, [searchTerm, filterStatus, filterPriority, filterCategory]);

  const unreadCount = messages.filter((m) => m.status === "unread").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;
  const highPriorityCount = messages.filter((m) => m.priority === "high").length;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchMessages = useCallback(async () => {
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
      // FIX: Check if filter value is not "all" before appending
      if (filterStatus !== "all") {
        queryParams.append("status", filterStatus);
      }
      if (filterPriority !== "all") {
        queryParams.append("priority", filterPriority);
      }
      if (filterCategory !== "all") {
        queryParams.append("category", filterCategory);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/messages?${queryParams.toString()}`
      );

      if (response.data.success) {
        setMessages(response.data.data);
        setTotalMessagesCount(response.data.pagination.totalProducts);
      } else {
        throw new Error(response.data.message || "Failed to fetch messages.");
      }
    } catch (err: any) {
      console.error("Error fetching messages:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load messages.");
      toast.error(`Error loading messages: ${err.response?.data?.message || err.message}`);
      setMessages([]);
      setTotalMessagesCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortOrder, debouncedSearchTerm, filterStatus, filterPriority, filterCategory]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const getStatusBadge = (status: Message["status"]) => {
    switch (status) {
      case "unread": return <Badge variant="destructive">Unread</Badge>;
      case "read": return <Badge variant="secondary">Read</Badge>;
      case "replied": return <Badge variant="default">Replied</Badge>;
      case "archived": return <Badge variant="outline">Archived</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: Message["priority"]) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "medium": return <Badge className="bg-orange-500 hover:bg-orange-600">Medium</Badge>;
      case "low": return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "sales": return <Badge className="bg-green-600 hover:bg-green-700">Sales</Badge>;
      case "support": return <Badge className="bg-blue-600 hover:bg-blue-700">Support</Badge>;
      case "complaint": return <Badge variant="destructive">Complaint</Badge>;
      case "general": return <Badge variant="outline">General</Badge>;
      case "quote": return <Badge className="bg-purple-600 hover:bg-purple-700">Quote</Badge>;
      case "sample": return <Badge className="bg-teal-600 hover:bg-teal-700">Sample</Badge>;
      case "custom": return <Badge className="bg-indigo-600 hover:bg-indigo-700">Custom</Badge>;
      case "partnership": return <Badge className="bg-pink-600 hover:bg-pink-700">Partnership</Badge>;
      default: return <Badge variant="outline">{category}</Badge>;
    }
  };

 const updateMessageStatus = async (messageId: string, newStatus: Message["status"], replyText?: string) => {
    console.log("Updating message status. ID:", messageId, "New Status:", newStatus, "Reply Text:", replyText);
    setLoading(true);
    try {
      const payload = { status: newStatus, replyText };
      console.log("Axios PATCH payload:", payload); // Log the exact payload before sending

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/messages/${messageId}`,
        payload
      );
      if (response.data.success) {
        toast.success(`Message marked as ${newStatus}!`);
        fetchMessages();
        if (newStatus === 'replied') {
          setIsReplyDialogOpen(false);
          setSelectedMessage(null);
          setReplyText("");
        }
      } else {
        throw new Error(response.data.message || "Failed to update message status.");
      }
    } catch (err: any) {
      console.error("Error updating message status:", err.response?.data || err.message);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/messages/${messageId}`
      );
      if (response.data.success) {
        toast.success("Message deleted successfully!");
        fetchMessages();
      } else {
        throw new Error(response.data.message || "Failed to delete message.");
      }
    } catch (err: any) {
      console.error("Error deleting message:", err.response?.data || err.message);
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = () => {
    if (selectedMessage && replyText.trim()) {
      updateMessageStatus(selectedMessage._id, "replied", replyText);
    } else {
      toast.error("Reply text cannot be empty.");
    }
  };

  const totalPages = Math.ceil(totalMessagesCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
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

  const handleExportCSV = () => {
    if (messages.length === 0) {
      toast.error("No messages to export.");
      return;
    }

    const headers = [
      "Message ID",
      "Subject",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Customer Company",
      "Customer Country",
      "Category",
      "Priority",
      "Status",
      "Message",
      "Created At",
      "Updated At",
    ];

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = messages.map((message) => {
      const createdAt = message.createdAt ? new Date(message.createdAt).toLocaleString() : "";
      const updatedAt = message.updatedAt ? new Date(message.updatedAt).toLocaleString() : "";

      return [
        escapeCsv(message._id),
        escapeCsv(message.subject),
        escapeCsv(message.customerName),
        escapeCsv(message.customerEmail),
        escapeCsv(message.customerPhone),
        escapeCsv(message.customerCompany),
        escapeCsv(message.customerCountry),
        escapeCsv(message.inquiryType),
        escapeCsv(message.priority),
        escapeCsv(message.status),
        escapeCsv(message.message),
        escapeCsv(createdAt),
        escapeCsv(updatedAt),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "messages.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Messages exported to CSV.");
  };


  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Messages
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage customer communications and inquiries
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading}>
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
              Message Overview
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
                      Total Messages
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {totalMessagesCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      All time messages
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Unread
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {unreadCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requiring attention
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Replied
                    </CardTitle>
                    <Reply className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {repliedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successfully responded
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      High Priority
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {highPriorityCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Urgent messages
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
                    placeholder="Search messages..."
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
                        Filter Messages
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
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="unread">Unread</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Priority
                        </Label>
                        <Select
                          value={tempFilterPriority}
                          onValueChange={(val) =>
                            handleTempFilterChange("priority", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Category
                        </Label>
                        <Select
                          value={tempFilterCategory}
                          onValueChange={(val) =>
                            handleTempFilterChange("category", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="quote">Quote</SelectItem>
                            <SelectItem value="sample">Sample</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
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
                        onClick={() => handleSort("subject")}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        Subject
                        {renderSortIcon("subject")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("customerName")}
                        className="px-2 h-auto justify-start hover:bg-muted"
                      >
                        From
                        {renderSortIcon("customerName")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("status")}
                        className="px-2 h-auto justify-center hover:bg-muted"
                      >
                        Status
                        {renderSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("priority")}
                        className="px-2 h-auto justify-center hover:bg-muted"
                      >
                        Priority
                        {renderSortIcon("priority")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("inquiryType")}
                        className="px-2 h-auto justify-center hover:bg-muted"
                      >
                        Category
                        {renderSortIcon("inquiryType")}
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
                            Loading messages...
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
                  ) : messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          No messages found matching your criteria.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.map((message) => (
                      <TableRow
                        key={message._id}
                        className={`border-b hover:bg-muted/50 transition-colors ${message.status === "unread" ? "bg-muted/50 font-medium" : ""}`}
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col">
                            <span className="line-clamp-1">{message.subject}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{message.message}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{message.customerName}</span>
                            <span className="text-xs text-muted-foreground">{message.customerEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(message.status)}</TableCell>
                        <TableCell className="text-center">{getPriorityBadge(message.priority)}</TableCell>
                        <TableCell className="text-center">{getCategoryBadge(message.inquiryType)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Dialog open={isReplyDialogOpen && selectedMessage?._id === message._id} onOpenChange={(open) => {
                              setIsReplyDialogOpen(open);
                              if (!open) setSelectedMessage(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    setReplyText("");
                                    if (message.status === "unread") {
                                      updateMessageStatus(message._id, "read");
                                    }
                                  }}
                                  className="h-8"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Reply
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{selectedMessage?.subject}</DialogTitle>
                                  <DialogDescription>
                                    Message from {selectedMessage?.customerName} ({selectedMessage?.customerEmail})
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedMessage && (
                                  <div className="space-y-4">
                                    <div className="flex flex-wrap items-center space-x-2">
                                      {getStatusBadge(selectedMessage.status)}
                                      {getPriorityBadge(selectedMessage.priority)}
                                      {getCategoryBadge(selectedMessage.inquiryType)}
                                      {selectedMessage.customerCompany && (
                                        <Badge variant="outline">{selectedMessage.customerCompany}</Badge>
                                      )}
                                      {selectedMessage.customerCountry && (
                                        <Badge variant="outline">{selectedMessage.customerCountry}</Badge>
                                      )}
                                      {selectedMessage.customerPhone && (
                                        <Badge variant="outline">{selectedMessage.customerPhone}</Badge>
                                      )}
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg border">
                                      <p className="text-sm">{selectedMessage.message}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Reply</Label>
                                      <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply here..."
                                        rows={4}
                                        disabled={loading}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button onClick={handleReply} disabled={loading}>
                                        <Reply className="mr-2 h-4 w-4" />
                                        Send Reply
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateMessageStatus(message._id, "archived")}
                              disabled={loading}
                              className="h-8"
                            >
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(message._id)}
                              disabled={loading}
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
                totalMessagesCount,
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, totalMessagesCount)} of{" "}
              {totalMessagesCount} results
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
  )
}