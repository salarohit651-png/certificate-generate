import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import AccessLink from "@/models/AccessLink"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] User login API called")
    const { email, phoneNumber } = await request.json()

    if (!email || !phoneNumber) {
      console.log("[v0] Missing email or phone number")
      return NextResponse.json({ error: "Email and phone number are required" }, { status: 400 })
    }

    console.log("[v0] Connecting to database for user login")
    await connectDB()

    // Find user by email and ensure they're not deleted
    console.log("[v0] Searching for user with email:", email)
    const user = await User.findOne({
      emailId: email.toLowerCase(),
    })

    if (!user) {
      console.log("[v0] User not found with email:", email)
      return NextResponse.json({ error: "Invalid email or phone number" }, { status: 401 })
    }

    console.log("[v0] User found, verifying phone number")
    console.log("[v0] Stored hashed password:", user.hashedPassword ? "exists" : "missing")
    console.log("[v0] Input phone number:", phoneNumber)

    // Verify phone number (used as password)
    const isPhoneValid = await bcrypt.compare(phoneNumber, user.hashedPassword)
    console.log("[v0] Phone number comparison result:", isPhoneValid)

    if (!isPhoneValid) {
      console.log("[v0] Phone number verification failed for user:", user._id)
      return NextResponse.json({ error: "Invalid email or phone number" }, { status: 401 })
    }

    console.log("[v0] Phone number verified, generating one-time access link")

    const timestamp = Date.now()
    const randomBytes = crypto.randomBytes(16).toString("hex")
    const newToken = Buffer.from(`${user.registrationNumber}-${timestamp}-${randomBytes}`).toString("base64url")

    // Create access link record in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry

    const accessLink = new AccessLink({
      token: newToken,
      registrationNumber: user.registrationNumber,
      isUsed: false,
      expiresAt,
    })

    await accessLink.save()

    const profileLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/user/${newToken}`

    const sessionToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.emailId,
        registrationNumber: user.registrationNumber,
        loginTime: Date.now(),
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }, // Token expires in 24 hours
    )

    console.log("[v0] Login successful for user:", user._id, "One-time profile link generated")

    return NextResponse.json({
      success: true,
      profileLink,
      token: sessionToken,
      message: "Login successful! Redirecting to your one-time profile link...",
    })
  } catch (error) {
    console.error("[v0] User login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
