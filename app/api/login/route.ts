import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // In a real app, you would validate against a database
    if (email === "admin@puregrain.com" && password === "admin123") {
      return NextResponse.json({
        success: true,
        user: {
          email,
          role: "admin",
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid credentials",
      },
      { status: 401 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 },
    )
  }
}
