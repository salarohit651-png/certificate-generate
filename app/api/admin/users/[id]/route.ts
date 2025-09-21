import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { uploadProfilePhoto, uploadQRCode } from "@/lib/cloudinary"
import mongoose from "mongoose"
import { checkAdminAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!checkAdminAuth()) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 })
    }

    console.log(`[v0] Updating user with ID: ${params.id}`)

    await connectDB()

    const formData = await request.formData()

    // Extract form fields
    const updateData: any = {
      registrationFormTitle: formData.get("registrationFormTitle"),
      title: formData.get("title"),
      name: formData.get("name"),
      fatherHusbandName: formData.get("fatherHusbandName"),
      mobileNo: formData.get("mobileNo"),
      emailId: formData.get("emailId"),
      dateOfBirth: formData.get("dateOfBirth"),
      passoutPercentage: Number.parseFloat(formData.get("passoutPercentage") as string),
      state: formData.get("state"),
      address: formData.get("address"),
      courseName: formData.get("courseName"),
      experience: formData.get("experience"),
      collegeName: formData.get("collegeName"),
      updatedAt: new Date(),
    }

    // Handle file uploads if provided
    const profilePhoto = formData.get("profilePhoto") as File
    const qrCode = formData.get("qrCode") as File

    if (profilePhoto && profilePhoto.size > 0) {
      console.log("[v0] Uploading new profile photo...")
      const photoUrl = await uploadProfilePhoto(profilePhoto)
      updateData.photoUrl = photoUrl
    }

    if (qrCode && qrCode.size > 0) {
      console.log("[v0] Uploading new QR code...")
      const qrCodeUrl = await uploadQRCode(qrCode)
      updateData.qrCodeUrl = qrCodeUrl
    }

    const updatedUser = await User.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true }).select(
      "-hashedPassword",
    )

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    console.log("[v0] User updated successfully")

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!checkAdminAuth()) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 })
    }

    console.log(`[v0] Starting deletion process for user ID: ${params.id}`)

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.log(`[v0] Invalid ObjectId format: ${params.id}`)
      return NextResponse.json({ success: false, message: "Invalid user ID format" }, { status: 400 })
    }

    await connectDB()
    console.log(`[v0] Database connected successfully`)

    const userExists = await User.findById(params.id)
    console.log(
      `[v0] User lookup result:`,
      userExists ? `Found user: ${userExists.name} (${userExists.emailId})` : "User not found",
    )

    if (!userExists) {
      console.log(`[v0] User not found for deletion with ID: ${params.id}`)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const deletionResult = await User.findByIdAndDelete(params.id)

    if (!deletionResult) {
      console.error(`[v0] Deletion failed - no user was deleted for ID: ${params.id}`)
      return NextResponse.json({ success: false, message: "Failed to delete user from database" }, { status: 500 })
    }

    const verifyDeletion = await User.findById(params.id)
    if (verifyDeletion) {
      console.error(`[v0] Deletion verification failed - user still exists in database`)
      return NextResponse.json({ success: false, message: "User deletion verification failed" }, { status: 500 })
    }

    console.log(`[v0] User deleted and verified successfully:`, {
      userId: deletionResult._id,
      userName: deletionResult.name,
      email: deletionResult.emailId,
    })

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
        deletedUserId: deletionResult._id,
        deletedUserName: deletionResult.name,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`[v0] Error deleting user with ID ${params.id}:`, error)
    return NextResponse.json(
      { success: false, message: "Failed to delete user", error: error.message },
      { status: 500 },
    )
  }
}
