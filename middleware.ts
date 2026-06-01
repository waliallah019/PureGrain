import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith("/admin-ahmza")) {
    // For now, we'll allow access to admin routes
    // In a real implementation, you would check for authentication here
    // You can integrate with your preferred auth solution

    // Skip login page from auth check
    if (request.nextUrl.pathname === "/admin-ahmza/login") {
      return NextResponse.next()
    }

    // For demo purposes, we'll allow access
    // In production, implement proper session checking
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin-ahmza/:path*"],
}
