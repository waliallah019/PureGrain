"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import axios from "axios"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts"
import {
  Package, FileText, Box, MessageSquare, Users, DollarSign, 
  TrendingUp, Clock, CheckCircle, AlertTriangle, RefreshCw
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { IQuoteRequest } from "@/types/quote"
import { ISampleRequest } from "@/lib/models/sampleRequestModel"

interface DashboardStats {
  products: {
    total: number
    finishedProducts: number
    rawLeather: number
  }
  quotes: {
    total: number
    requested: number
    approved: number
    paid: number
    totalValue: number
  }
  samples: {
    total: number
    pending: number
    processing: number
    shipped: number
    delivered: number
  }
  messages: {
    total: number
    unread: number
    replied: number
    highPriority: number
  }
  customRequests: {
    total: number
    pending: number
    completed: number
  }
}

interface RecentActivity {
  quotes: IQuoteRequest[]
  samples: ISampleRequest[]
  messages: any[]
}

const COLORS = ["#8B4513", "#A0522D", "#CD853F", "#DEB887", "#D2691E"]

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    products: { total: 0, finishedProducts: 0, rawLeather: 0 },
    quotes: { total: 0, requested: 0, approved: 0, paid: 0, totalValue: 0 },
    samples: { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 },
    messages: { total: 0, unread: 0, replied: 0, highPriority: 0 },
    customRequests: { total: 0, pending: 0, completed: 0 },
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    quotes: [],
    samples: [],
    messages: [],
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [statusDistribution, setStatusDistribution] = useState<any[]>([])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL
      
      // Fetch all data in parallel
      const [
        productsRes,
        rawLeatherRes,
        quotesRes,
        samplesRes,
        messagesRes,
        customRequestsRes,
      ] = await Promise.allSettled([
        axios.get(`${apiUrl}/finished-products?page=1&limit=1`),
        axios.get(`${apiUrl}/raw-leather?page=1&limit=1`),
        axios.get(`${apiUrl}/quote-requests?page=1&limit=1000`),
        axios.get(`${apiUrl}/sample-requests?page=1&limit=1000`),
        axios.get(`${apiUrl}/messages?page=1&limit=1000`),
        fetch(`${apiUrl}/custom-manufacturing?page=1&limit=1000`).then(r => r.json()),
      ])

      // Process Products
      const finishedProductsTotal = productsRes.status === 'fulfilled' 
        ? productsRes.value.data.pagination?.totalProducts || 0 
        : 0
      const rawLeatherTotal = rawLeatherRes.status === 'fulfilled'
        ? rawLeatherRes.value.data.pagination?.totalProducts || 0
        : 0

      // Process Quotes
      const quotesData = quotesRes.status === 'fulfilled' && quotesRes.value.data.success
        ? quotesRes.value.data.data as IQuoteRequest[]
        : []
      const quotesStats = {
        total: quotesRes.status === 'fulfilled' && quotesRes.value.data.success
          ? quotesRes.value.data.pagination?.totalProducts || quotesData.length
          : 0,
        requested: quotesData.filter(q => q.status === 'requested').length,
        approved: quotesData.filter(q => q.status === 'approved').length,
        paid: quotesData.filter(q => q.status === 'paid').length,
        totalValue: quotesData
          .filter(q => q.proposedTotalPrice)
          .reduce((sum, q) => sum + (q.proposedTotalPrice || 0), 0),
      }

      // Process Samples
      const samplesData = samplesRes.status === 'fulfilled' && samplesRes.value.data.success
        ? samplesRes.value.data.data as ISampleRequest[]
        : []
      const samplesStats = {
        total: samplesRes.status === 'fulfilled' && samplesRes.value.data.success
          ? samplesRes.value.data.pagination?.totalProducts || samplesData.length
          : 0,
        pending: samplesData.filter(s => s.paymentStatus === 'pending').length,
        processing: samplesData.filter(s => s.paymentStatus === 'processing').length,
        shipped: samplesData.filter(s => s.paymentStatus === 'shipped').length,
        delivered: samplesData.filter(s => s.paymentStatus === 'delivered').length,
      }

      // Process Messages
      const messagesData = messagesRes.status === 'fulfilled' && messagesRes.value.data.success
        ? messagesRes.value.data.data
        : []
      const messagesStats = {
        total: messagesRes.status === 'fulfilled' && messagesRes.value.data.success
          ? messagesRes.value.data.pagination?.totalProducts || messagesData.length
          : 0,
        unread: messagesData.filter((m: any) => m.status === 'unread').length,
        replied: messagesData.filter((m: any) => m.status === 'replied').length,
        highPriority: messagesData.filter((m: any) => m.priority === 'high').length,
      }

      // Process Custom Requests
      const customRequestsData = customRequestsRes.status === 'fulfilled' && customRequestsRes.value.success
        ? customRequestsRes.value.data
        : []
      const customRequestsStats = {
        total: customRequestsRes.status === 'fulfilled' && customRequestsRes.value.success
          ? customRequestsRes.value.pagination?.totalProducts || customRequestsData.length
          : 0,
        pending: customRequestsData.filter((r: any) => r.status === 'Pending').length,
        completed: customRequestsData.filter((r: any) => r.status === 'Completed').length,
      }

      setStats({
        products: {
          total: finishedProductsTotal + rawLeatherTotal,
          finishedProducts: finishedProductsTotal,
          rawLeather: rawLeatherTotal,
        },
        quotes: quotesStats,
        samples: samplesStats,
        messages: messagesStats,
        customRequests: customRequestsStats,
      })

      // Get recent activity (latest 5 of each)
      setRecentActivity({
        quotes: quotesData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
        samples: samplesData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
        messages: messagesData
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
      })

      // Calculate monthly data for last 6 months
      const monthlyStats: { [key: string]: { quotes: number; samples: number; revenue: number } } = {}
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i)
        const monthKey = format(monthDate, 'MMM yyyy')
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)

        monthlyStats[monthKey] = {
          quotes: quotesData.filter(q => {
            const qDate = new Date(q.createdAt)
            return qDate >= monthStart && qDate <= monthEnd
          }).length,
          samples: samplesData.filter(s => {
            const sDate = new Date(s.createdAt)
            return sDate >= monthStart && sDate <= monthEnd
          }).length,
          revenue: quotesData
            .filter(q => {
              const qDate = new Date(q.createdAt)
              return qDate >= monthStart && qDate <= monthEnd && q.status === 'paid'
            })
            .reduce((sum, q) => sum + (q.proposedTotalPrice || 0), 0),
        }
      }
      setMonthlyData(Object.entries(monthlyStats).map(([name, data]) => ({ name, ...data })))

      // Status distribution for quotes
      const statusCounts: { [key: string]: number } = {}
      quotesData.forEach(q => {
        statusCounts[q.status] = (statusCounts[q.status] || 0) + 1
      })
      setStatusDistribution(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      )

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.push("/admin-login")
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center text-lg font-medium">Checking authentication...</div>
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Overview & insights for your business
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.products.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.products.finishedProducts} finished, {stats.products.rawLeather} leather hides
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quote Requests
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.quotes.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.quotes.requested} pending, {stats.quotes.approved} approved
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sample Requests
              </CardTitle>
              <Box className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.samples.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.samples.pending} pending, {stats.samples.delivered} delivered
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${stats.quotes.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From paid quote requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.messages.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.messages.unread} unread, {stats.messages.highPriority} high priority
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custom Requests
              </CardTitle>
              <Users className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.customRequests.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.customRequests.pending} pending, {stats.customRequests.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Quotes
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.quotes.paid}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully paid quote requests
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing Samples
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.samples.processing + stats.samples.shipped}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In progress or shipped
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Quote requests, sample requests, and revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="quotes" fill="#8B4513" name="Quote Requests" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="samples" fill="#A0522D" name="Sample Requests" radius={[4, 4, 0, 0]} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Quote Status Distribution</CardTitle>
              <CardDescription>Breakdown of quote request statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : statusDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Tables */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Recent Quote Requests</CardTitle>
                <CardDescription>Latest quote requests</CardDescription>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent quotes</p>
              ) : (
                recentActivity.quotes.map((quote) => (
                  <Link
                    key={quote._id}
                    href={`/admin-ahmza/quotes/${quote._id}`}
                    className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{quote.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{quote.companyName}</p>
                    </div>
                    <div className="text-right ml-2">
                      <Badge variant="outline" className="text-xs">
                        {quote.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(quote.createdAt), 'MMM dd')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
              {recentActivity.quotes.length > 0 && (
                <Link href="/admin-ahmza/quotes" className="text-sm text-primary hover:underline text-center block pt-2">
                  View all quotes →
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Recent Sample Requests</CardTitle>
                <CardDescription>Latest sample requests</CardDescription>
              </div>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.samples.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent samples</p>
              ) : (
                recentActivity.samples.map((sample) => (
                  <Link
                    key={sample._id}
                    href={`/admin-ahmza/samples/${sample._id}`}
                    className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{sample.contactPerson}</p>
                      <p className="text-xs text-muted-foreground truncate">{sample.companyName}</p>
                    </div>
                    <div className="text-right ml-2">
                      <Badge 
                        variant={sample.paymentStatus === 'pending' ? 'outline' : 'default'}
                        className="text-xs"
                      >
                        {sample.paymentStatus}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(sample.createdAt), 'MMM dd')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
              {recentActivity.samples.length > 0 && (
                <Link href="/admin-ahmza/samples" className="text-sm text-primary hover:underline text-center block pt-2">
                  View all samples →
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Recent Messages</CardTitle>
                <CardDescription>Latest customer messages</CardDescription>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent messages</p>
              ) : (
                recentActivity.messages.map((message: any) => (
                  <Link
                    key={message._id}
                    href="/admin-ahmza/messages"
                    className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{message.subject || 'No subject'}</p>
                      <p className="text-xs text-muted-foreground truncate">{message.customerName}</p>
                    </div>
                    <div className="text-right ml-2">
                      {message.status === 'unread' && (
                        <Badge variant="destructive" className="text-xs mb-1">New</Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'MMM dd')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
              {recentActivity.messages.length > 0 && (
                <Link href="/admin-ahmza/messages" className="text-sm text-primary hover:underline text-center block pt-2">
                  View all messages →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate to key admin sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link href="/admin-ahmza/products">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/admin-ahmza/quotes">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Quotes
                </Button>
              </Link>
              <Link href="/admin-ahmza/samples">
                <Button variant="outline" className="w-full justify-start">
                  <Box className="mr-2 h-4 w-4" />
                  Samples
                </Button>
              </Link>
              <Link href="/admin-ahmza/custom-manufacturing">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Custom Requests
                </Button>
              </Link>
              <Link href="/admin-ahmza/messages">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
