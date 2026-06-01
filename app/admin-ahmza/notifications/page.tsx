"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search,
  MessageSquare,
  Package,
  Truck,
  FileText,
  DollarSign,
  Send,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

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
import { Input } from "@/components/ui/input";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type:
    | "info"
    | "warning"
    | "error"
    | "success"
    | "new_message"
    | "new_sample_request"
    | "sample_status_update"
    | "new_quote_request"
    | "quote_status_update"
    | "invoice_sent"
    | "payment_received";
  read: boolean;
  link?: string;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

type SortKey = keyof Notification;
type SortOrder = "asc" | "desc";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0);

  const [sortColumn, setSortColumn] = useState<SortKey | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterReadStatus, setFilterReadStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchNotifications = useCallback(async () => {
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
      if (filterReadStatus !== "all") {
        queryParams.append("read", filterReadStatus);
      }
      if (filterType !== "all") {
        queryParams.append("type", filterType);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications?${queryParams.toString()}`,
      );

      if (response.data.success) {
        setNotifications(response.data.data);
        setTotalNotificationsCount(response.data.pagination.totalProducts);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch notifications.",
        );
      }
    } catch (err: any) {
      console.error(
        "Error fetching notifications:",
        err.response?.data || err.message,
      );
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load notifications.",
      );
      setNotifications([]);
      setTotalNotificationsCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    sortColumn,
    sortOrder,
    debouncedSearchTerm,
    filterReadStatus,
    filterType,
  ]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // Depend on fetchNotifications

  const markAsRead = async (
    id: string,
    shouldRedirect: boolean = false,
    redirectLink?: string,
  ) => {
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications/${id}`,
        { read: true },
      );
      if (response.data.success) {
        // Update local state: mark as read
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
        );
        // If the current filter is 'unread', or if 'all' and we want it to visually disappear,
        // we might need to filter it out or trigger a re-fetch.
        // For simplicity and to ensure pagination/filters are respected,
        // we'll trigger a re-fetch after a short delay for a smoother visual.
        toast.success("Notification marked as read!");
        // Small delay to allow toast to show, then re-fetch
        setTimeout(() => fetchNotifications(), 300);

        if (shouldRedirect && redirectLink) {
          router.push(redirectLink);
        }
      } else {
        toast.error("Failed to mark notification as read.");
      }
    } catch (err: any) {
      console.error(
        "Error marking notification as read:",
        err.response?.data || err.message,
      );
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const markAllAsRead = async () => {
    if (
      !window.confirm("Are you sure you want to mark all notifications as read?")
    ) {
      return;
    }
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications`,
      );
      if (response.data.success) {
        toast.success(response.data.message);
        // Optimistically update local state to reflect all as read
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        // Re-fetch to ensure consistency with backend filters/pagination
        fetchNotifications();
      } else {
        throw new Error(
          response.data.message || "Failed to mark all notifications as read.",
        );
      }
    } catch (err: any) {
      console.error(
        "Error marking all notifications as read:",
        err.response?.data || err.message,
      );
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications/${id}`,
      );
      if (response.data.success) {
        toast.success("Notification deleted successfully!");
        // Optimistically update local state to remove the notification
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setTotalNotificationsCount((prev) => prev - 1);
        // Re-fetch to handle potential pagination changes
        fetchNotifications();
      } else {
        throw new Error(response.data.message || "Failed to delete notification.");
      }
    } catch (err: any) {
      console.error(
        "Error deleting notification:",
        err.response?.data || err.message,
      );
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case "new_sample_request":
        return <Package className="h-5 w-5 text-amber-600" />;
      case "sample_status_update":
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case "new_quote_request":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "quote_status_update":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "invoice_sent":
        return <Send className="h-5 w-5 text-orange-600" />;
      case "payment_received":
        return <DollarSign className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationBadge = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <Badge variant="outline">Info</Badge>;
      case "warning":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">Warning</Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "success":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Success</Badge>
        );
      case "new_message":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            New Message
          </Badge>
        );
      case "new_sample_request":
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700">
            Sample Request
          </Badge>
        );
      case "sample_status_update":
        return (
          <Badge className="bg-indigo-600 hover:bg-indigo-700">
            Sample Update
          </Badge>
        );
      case "new_quote_request":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">New Quote</Badge>
        );
      case "quote_status_update":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            Quote Update
          </Badge>
        );
      case "invoice_sent":
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">
            Invoice Sent
          </Badge>
        );
      case "payment_received":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            Payment Received
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Filter local notifications state for rendering unread count (responsive)
  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalPages = Math.ceil(totalNotificationsCount / itemsPerPage);

  const handlePageChange = (page: number) => {
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
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const renderSortIcon = (column: SortKey) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return (
      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (loading) return;

    // Mark as read and then potentially redirect
    markAsRead(notification._id, true, notification.link);
    // The markAsRead function will handle the actual redirection after marking as read.
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with important alerts and messages
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} disabled={loading}>
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotificationsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-primary" /> {/* Changed icon to emphasize unread */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalNotificationsCount - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Latest alerts and system messages</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-4 flex flex-col items-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="relative flex-grow md:w-auto w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4"
              />
            </div>
            <div className="flex w-full space-x-2 md:w-auto">
              <Select
                value={filterReadStatus}
                onValueChange={setFilterReadStatus}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Read Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="false">Unread</SelectItem>
                  <SelectItem value="true">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="new_quote_request">
                    New Quote Request
                  </SelectItem>
                  <SelectItem value="quote_status_update">
                    Quote Status Update
                  </SelectItem>
                  <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                  <SelectItem value="payment_received">
                    Payment Received
                  </SelectItem>
                  <SelectItem value="new_sample_request">
                    New Sample Request
                  </SelectItem>
                  <SelectItem value="sample_status_update">
                    Sample Status Update
                  </SelectItem>
                  <SelectItem value="new_message">New Message</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="flex h-24 items-center justify-center text-destructive">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No notifications found.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors duration-200 
                  ${
                    !notification.read
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/40" // Highlight unread
                      : "bg-background hover:bg-gray-50 dark:hover:bg-gray-800" // Normal background for read
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getNotificationBadge(notification.type)}
                        {!notification.read && (
                          <Badge
                            variant="secondary"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs" // Brighter New badge
                          >
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {/* Only show "Mark as Read" button if it's currently unread AND has no link to prevent double action */}
                        {!notification.read && !notification.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent parent div click
                              markAsRead(notification._id);
                            }}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent parent div click
                            deleteNotification(notification._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {`Displaying ${notifications.length} of ${totalNotificationsCount} notifications`}
        </div>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
              totalPages <= 7 ||
              (page >= currentPage - 2 && page <= currentPage + 2) ||
              page === 1 ||
              page === totalPages ? (
                <PaginationItem key={page} className="hidden sm:inline-flex">
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className={loading ? "pointer-events-none opacity-50" : ""}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : page === currentPage - 3 || page === currentPage + 3 ? (
                <PaginationItem key={page} className="hidden sm:inline-flex">
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    ...
                  </span>
                </PaginationItem>
              ) : null,
            )}
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={
                  currentPage === totalPages || totalPages === 0 || loading
                }
                className="h-8 w-8"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}