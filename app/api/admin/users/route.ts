import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { checkAdminAuth } from "@/lib/auth"

export async function GET() {
  try {
    if (!checkAdminAuth()) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 })
    }


    await connectDB()

    const users = await User.find({
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
      .select("-hashedPassword") // Exclude password from response
      .sort({ createdAt: -1 })
      .lean() // Added lean() to get plain JavaScript objects

    console.log(`[v0] Successfully found ${users.length} users`)
    if (users.length > 0) {
      console.log(`[v0] Sample user ID format:`, typeof users[0]._id, users[0]._id.toString())
      console.log(`[v0] Latest 3 users from database:`)
      users.slice(0, 3).forEach((user, index) => {
        console.log(`[v0] DB User ${index + 1}:`, {
          id: user._id.toString(),
          name: user.name,
          email: user.emailId,
          regNumber: user.registrationNumber,
          createdAt: user.createdAt,
          hasDeletedAt: !!user.deletedAt,
        })
      })
    }

    const serializedUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }))


    const response = NextResponse.json({
      success: true,
      users: serializedUsers,
      totalCount: serializedUsers.length, // Added total count for debugging
    })

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("[v0] Detailed error in GET /api/admin/users:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
