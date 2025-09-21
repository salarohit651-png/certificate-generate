import { type NextRequest, NextResponse } from "next/server"
import { validateAdminCredentials } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    console.log("[v0] Login API: Received login request for username:", username)

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    if (validateAdminCredentials(username, password)) {
      console.log("[v0] Login API: Credentials validated successfully")

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
      })

      console.log("[v0] Login API: Setting admin session cookie")
      response.cookies.set("admin-session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      })

      console.log("[v0] Login API: Cookie set, returning success response")
      return response
    } else {
      console.log("[v0] Login API: Invalid credentials provided")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
