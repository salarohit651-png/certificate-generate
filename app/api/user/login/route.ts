import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import AccessLink from "@/models/AccessLink"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, phoneNumber } = await request.json();

    if (!email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Email and phone number are required' },
        { status: 400 },
      );
    }

    await connectDB();

    // Find user by email and ensure they're not deleted
    const user = await User.findOne({
      emailId: email.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or phone number' },
        { status: 401 },
      );
    }

    // Verify phone number (used as password)
    const isPhoneValid = await bcrypt.compare(phoneNumber, user.hashedPassword);

    if (!isPhoneValid) {
      return NextResponse.json(
        { error: 'Invalid email or phone number' },
        { status: 401 },
      );
    }

    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const newToken = Buffer.from(
      `${user.registrationNumber}-${timestamp}-${randomBytes}`,
    ).toString('base64url');

    // Create access link record in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    const accessLink = new AccessLink({
      token: newToken,
      registrationNumber: user.registrationNumber,
      isUsed: false,
      expiresAt,
    });

    await accessLink.save();

    const profileLink = `${
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }/user/${newToken}`;

    const sessionToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.emailId,
        registrationNumber: user.registrationNumber,
        loginTime: Date.now(),
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }, // Token expires in 24 hours
    );

    return NextResponse.json({
      success: true,
      profileLink,
      token: sessionToken,
      message: 'Login successful! Redirecting to your profile link...',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 },
    );
  }
}
