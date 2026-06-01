"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link";
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Bell, Search, Menu, MessageSquare, Check, XCircle, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "react-hot-toast"
import axios from "axios"
import { Badge } from "@/components/ui/badge"

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'new_message';
  read: boolean;
  link?: string;
  relatedId?: string;
  createdAt: string;
}

interface AdminHeaderProps {
  onMenuToggle: () => void
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const fetchNotificationsData = useCallback(async () => {
    console.log("FETCH NOTIFICATIONS: Starting data fetch...");
    setNotificationsLoading(true);
    try {
      // Get count of unread notifications
      const countResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications?read=false&limit=1`
      );
      
      let unreadCount = 0;
      let recentUnreadNotifications: Notification[] = [];
      
      if (countResponse.data.success) {
        unreadCount = countResponse.data.pagination.totalProducts;
        console.log("FETCH NOTIFICATIONS: Unread count response:", unreadCount);
        console.log("FETCH NOTIFICATIONS: Full count response:", countResponse.data);
        
        // Only fetch recent unread notifications if there are any unread notifications
        if (unreadCount > 0) {
          const recentResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications?read=false&limit=5&sortBy=createdAt&order=desc`
          );
          
          if (recentResponse.data.success) {
            recentUnreadNotifications = recentResponse.data.data;
            console.log("FETCH NOTIFICATIONS: Recent unread notifications data:", recentUnreadNotifications);
            console.log("FETCH NOTIFICATIONS: Full recent response:", recentResponse.data);
          } else {
            console.error("FETCH NOTIFICATIONS: Failed to get recent unread notifications.", recentResponse.data);
          }
        } else {
          console.log("FETCH NOTIFICATIONS: No unread notifications found.");
        }
      } else {
        console.error("FETCH NOTIFICATIONS: Failed to get unread count.", countResponse.data);
      }
      
      // Update state with fetched data (this ensures consistency)
      console.log("FETCH NOTIFICATIONS: Updating state - unreadCount:", unreadCount, "recentUnreadNotifications:", recentUnreadNotifications.length);
      setUnreadNotificationCount(unreadCount);
      setRecentNotifications(recentUnreadNotifications);
      
    } catch (error: any) {
      console.error("FETCH NOTIFICATIONS: Failed to fetch notifications for header:", error.response?.data || error.message);
      // Reset to safe defaults on error
      setUnreadNotificationCount(0);
      setRecentNotifications([]);
    } finally {
      setNotificationsLoading(false);
      console.log("FETCH NOTIFICATIONS: Data fetch finished.");
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string, redirectLink?: string) => {
    console.log(`MARK ONE: Marking notification ${id} as read...`);
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications/${id}`,
        { read: true }
      );
      if (response.data.success) {
        console.log(`MARK ONE: Notification ${id} marked as read successfully on server.`);
        
        // Optimistically update local state
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
        setRecentNotifications(prev => prev.filter(n => n._id !== id));
        
        toast.success("Notification marked as read.");
        
        if (redirectLink) {
          router.push(redirectLink);
        }
      } else {
        toast.error("Failed to mark notification as read.");
        console.error(`MARK ONE: Failed to mark notification ${id} as read on server.`, response.data);
      }
    } catch (error: any) {
      console.error("MARK ONE: Error marking notification as read:", error.response?.data || error.message);
      toast.error("Error marking notification as read.");
      // Re-fetch on error to ensure state consistency
      await fetchNotificationsData();
    }
  }, [router, fetchNotificationsData]);

  const markAllNotificationsAsRead = useCallback(async () => {
    console.log("MARK ALL: Initiating mark all as read action...");
    try {
      setNotificationsLoading(true);
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/notifications`
      );
      
      if (response.data.success) {
        console.log("MARK ALL: Server confirmed all notifications marked as read.");
        toast.success(response.data.message);
        
        // Immediately update local state to reflect "all read" status
        setUnreadNotificationCount(0);
        setRecentNotifications([]);
        
        // Also fetch fresh data to ensure consistency with server
        await fetchNotificationsData();
        setIsPopoverOpen(false);
      } else {
        toast.error("Failed to mark all notifications as read.");
        console.error("MARK ALL: Server reported failure marking all as read.", response.data);
      }
    } catch (error: any) {
      console.error("MARK ALL: Error marking all notifications as read:", error.response?.data || error.message);
      toast.error("Error marking all notifications as read.");
      // Re-fetch on error to ensure state consistency
      await fetchNotificationsData();
    } finally {
      setNotificationsLoading(false);
      console.log("MARK ALL: Action finished.");
    }
  }, [fetchNotificationsData]);

  useEffect(() => {
    console.log("USE_EFFECT: Component mounted/dependencies changed. Initial fetch or interval setup.");
    fetchNotificationsData(); // Initial fetch on mount

    const interval = setInterval(() => {
      console.log("USE_EFFECT: Polling for notifications...");
      fetchNotificationsData();
    }, 60000); // Poll every 60 seconds

    return () => {
      console.log("USE_EFFECT: Cleaning up interval.");
      clearInterval(interval);
    }
  }, [fetchNotificationsData]);

  // Add a useEffect to log state changes, useful for debugging
  useEffect(() => {
    console.log("STATE UPDATE: Current unreadNotificationCount:", unreadNotificationCount);
    console.log("STATE UPDATE: Current recentNotifications.length:", recentNotifications.length);
  }, [unreadNotificationCount, recentNotifications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
    // Implement actual search logic or redirect to search page
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "new_message": return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadge = (type: Notification["type"]) => {
    switch (type) {
      case "info": return <Badge variant="outline" className="text-blue-600 border-blue-200">Info</Badge>;
      case "warning": return <Badge className="bg-orange-500 text-white hover:bg-orange-500/80">Warning</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      case "success": return <Badge className="bg-green-600 text-white hover:bg-green-600/80">Success</Badge>;
      case "new_message": return <Badge className="bg-purple-600 text-white hover:bg-purple-600/80">New Message</Badge>;
      default: return <Badge variant="secondary">Other</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-950 dark:border-gray-800">
      <div className="flex items-center lg:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="hidden md:flex md:w-1/3 lg:w-1/4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-gray-100 pl-8 dark:bg-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:block">
            <div className="text-sm font-medium">{user.email}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Administrator</div>
          </div>
        )}

        {/* Notification Popover Trigger */}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" disabled={notificationsLoading}>
              <Bell className="h-5 w-5" />
              {/* Show count only if > 0 */}
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                  {unreadNotificationCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {/* Show "Mark All as Read" only if there are unread notifications */}
              {unreadNotificationCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0 py-0 text-xs text-amber-600"
                  onClick={markAllNotificationsAsRead}
                  disabled={notificationsLoading}
                >
                  <Check className="h-3 w-3 mr-1" /> Mark All as Read
                </Button>
              )}
            </div>
            {notificationsLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : unreadNotificationCount === 0 ? (
              // Show this if no unread notifications (after loading)
              <div className="p-4 text-center text-sm text-muted-foreground">You're all caught up!</div>
            ) : recentNotifications.length === 0 && unreadNotificationCount > 0 ? (
              // This case happens if there are unread notifications but they are beyond the limit=5 for recentResponse.
              <div className="p-4 text-center text-sm text-muted-foreground">You have {unreadNotificationCount} unread notifications. Click "View all" below to see them.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.map(notification => (
                  <div
                    key={notification._id}
                    className="flex items-start gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => markNotificationAsRead(notification._id, notification.link || "/admin-ahmza/notifications")}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-sm font-medium mb-0.5">
                        <span className="line-clamp-1">{notification.title}</span>
                        {getNotificationBadge(notification.type)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-2 border-t flex justify-end">
                <Link href="/admin-ahmza/notifications" passHref>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsPopoverOpen(false)}>
                        View all notifications
                    </Button>
                </Link>
            </div>
          </PopoverContent>
        </Popover>

        <ThemeToggle />
      </div>
    </header>
  )
}