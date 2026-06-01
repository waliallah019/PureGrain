import { type NextRequest, NextResponse } from "next/server"

// Simple demo authentication
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Demo credentials - in production, use proper authentication
    if (email === "ahamz48" && password === "JaguarX8") {
      return NextResponse.json({
        success: true,
        user: { email, role: "admin" },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid credentials",
      },
      { status: 401 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication failed",
      },
      { status: 500 },
    )
  }
}
