// lib/admin-data.ts
//
// PLACEHOLDER data for the legacy admin "Orders" screen only. This is NOT
// connected to the database — real order-equivalent data lives in the Quotes,
// Sample Requests, and Custom Manufacturing admin sections. The unused
// mockProducts / mockCustomers / mockNotifications scaffolding was removed.

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
