// Mock data for admin panel - replace with actual database calls
export interface Product {
  id: string
  name: string
  category: "raw-leather" | "finished-products"
  price: number
  stock: number
  description: string
  images: string[]
  status: "active" | "inactive" | "out-of-stock"
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  products: { productId: string; quantity: number; price: number }[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: Date
  shippingAddress: string
}

export interface Customer {
  id: string
  name: string
  email: string
  company: string
  phone: string
  totalOrders: number
  totalSpent: number
  status: "active" | "inactive"
  createdAt: Date
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  read: boolean
  createdAt: Date
}

// Mock data
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Premium Cowhide Leather",
    category: "raw-leather",
    price: 45.99,
    stock: 150,
    description: "High-quality cowhide leather perfect for crafting",
    images: ["/placeholder.svg?height=200&width=200"],
    status: "active",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    name: "Leather Wallet",
    category: "finished-products",
    price: 89.99,
    stock: 75,
    description: "Handcrafted leather wallet with multiple compartments",
    images: ["/placeholder.svg?height=200&width=200"],
    status: "active",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
  },
]

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "John Smith",
    customerEmail: "john@example.com",
    products: [{ productId: "1", quantity: 10, price: 45.99 }],
    total: 459.9,
    status: "processing",
    createdAt: new Date("2024-01-20"),
    shippingAddress: "123 Main St, New York, NY 10001",
  },
]

export const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    company: "Smith Leather Co.",
    phone: "+1 (555) 123-4567",
    totalOrders: 5,
    totalSpent: 2299.5,
    status: "active",
    createdAt: new Date("2024-01-01"),
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Order Received",
    message: "Order #ORD-001 has been placed by John Smith",
    type: "info",
    read: false,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    title: "Low Stock Alert",
    message: "Premium Cowhide Leather is running low (15 units left)",
    type: "warning",
    read: false,
    createdAt: new Date("2024-01-19"),
  },
]
