import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { uploadProfilePhoto, uploadQRCode } from "@/lib/cloudinary"
import { sendEmail, getRegistrationEmailTemplate } from "@/lib/email"
import { getPublicProfileLink } from "@/lib/url-utils"
import bcrypt from "bcryptjs"
import { checkAdminAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth()) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    console.log("[v0] ===== REGISTRATION REQUEST START =====")

    const dbPromise = connectDB()

    console.log("[v0] Step 1: Parsing FormData...")
    const formData = await request.formData()

    console.log("[v0] Step 2: Extracting form fields...")
    const userData = {
      registrationFormTitle: formData.get("registrationFormTitle") as string,
      title: formData.get("title") as string,
      name: formData.get("name") as string,
      fatherHusbandName: formData.get("fatherHusbandName") as string,
      mobileNo: formData.get("mobileNo") as string,
      emailId: formData.get("emailId") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      passoutPercentage: Number(formData.get("passoutPercentage")),
      state: formData.get("state") as string,
      address: formData.get("address") as string,
      courseName: formData.get("courseName") as string,
      experience: formData.get("experience") as string,
      collegeName: formData.get("collegeName") as string,
    }

    const photo = formData.get("profilePhoto") as File
    const qrCode = formData.get("qrCode") as File | null

    // Basic validation
    if (!userData.name || !userData.emailId || !userData.mobileNo || !photo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (photo.size === 0 || !photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload a valid photo file" }, { status: 400 })
    }

    await dbPromise

    console.log("[v0] Step 3: Checking for existing user...")
    const existingUser = await User.findOne({
      $or: [{ emailId: userData.emailId }, { mobileNo: userData.mobileNo }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    console.log("[v0] Step 4: Uploading files in parallel...")
    const uploadPromises = []

    if (photo && photo.size > 0) {
      uploadPromises.push(uploadProfilePhoto(photo))
    }

    if (qrCode && qrCode.size > 0) {
      uploadPromises.push(uploadQRCode(qrCode))
    }

    const uploadResults = await Promise.allSettled(uploadPromises)

    let photoUrl = ""
    let qrCodeUrl = ""

    if (uploadResults[0]?.status === "fulfilled") {
      photoUrl = uploadResults[0].value
    }

    if (uploadResults[1]?.status === "fulfilled") {
      qrCodeUrl = uploadResults[1].value
    }

    console.log("[v0] Step 5: Creating user in database...")
    const year = new Date().getFullYear()
    const randomNum = Math.floor(10000 + Math.random() * 90000)
    const registrationNumber = `MOH${year}${randomNum}`

    const hashedPhoneNumber = await bcrypt.hash(userData.mobileNo, 10) // Reduced salt rounds for faster hashing

    const newUser = new User({
      ...userData,
      photoUrl,
      qrCodeUrl,
      registrationNumber,
      hashedPassword: hashedPhoneNumber,
    })

    await newUser.save()
    console.log("[v0] User created successfully with ID:", newUser._id)

    console.log("[v0] Step 6: Sending registration email...")
    const profileUrl = getPublicProfileLink(registrationNumber)

    try {
      const emailHtml = getRegistrationEmailTemplate(
        {
          name: userData.name,
          emailId: userData.emailId,
          mobileNo: userData.mobileNo,
          registrationNumber: registrationNumber,
          courseName: userData.courseName,
        },
        profileUrl,
      )

      console.log("[v0] Attempting to send email to:", userData.emailId)
      const emailSent = await sendEmail({
        to: userData.emailId,
        subject: "Registration Successful - Certificate System",
        html: emailHtml,
      })

      if (emailSent) {
        console.log("[v0] ✅ Registration email sent successfully!")
      } else {
        console.log("[v0] ⚠️ Registration email failed to send, but user was created")
      }
    } catch (emailError) {
      console.log("[v0] ❌ Email sending error:", emailError)
      // Don't fail the registration if email fails
    }

    console.log("[v0] ===== REGISTRATION SUCCESS =====")
    console.log("[v0] ✅ User successfully saved to database:")
    console.log("[v0] - User ID:", newUser._id.toString())
    console.log("[v0] - Name:", newUser.name)
    console.log("[v0] - Email:", newUser.emailId)
    console.log("[v0] - Registration Number:", newUser.registrationNumber)
    console.log("[v0] - Created At:", newUser.createdAt)

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        registrationNumber: newUser.registrationNumber,
        emailId: newUser.emailId, // Added email to response for verification
        createdAt: newUser.createdAt, // Added timestamp to response
      },
    })
  } catch (error) {
    console.log("[v0] ===== REGISTRATION ERROR =====")
    console.log("[v0] Registration error:", error)

    return NextResponse.json(
      {
        error: "Registration failed. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
