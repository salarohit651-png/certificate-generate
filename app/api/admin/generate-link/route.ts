import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import AccessLink from '@/models/AccessLink';
import crypto from 'crypto';
import { checkAdminAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 },
      );
    }

    console.log('[v0] Generating user view link...');

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const newToken = Buffer.from(
      `${user.registrationNumber}-${timestamp}-${randomBytes}`,
    ).toString('base64url');

    // Create access link record in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    const accessLink = new AccessLink({
      token: newToken,
      registrationNumber: user.registrationNumber,
      isUsed: false,
      expiresAt,
    });

    await accessLink.save();

    // Ensure clean URL construction without double slashes
    const baseUrl = (
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const publicProfileUrl = `${baseUrl}/user/${newToken}`;

    console.log('[v0] New one-time access link generated:', publicProfileUrl);

    return NextResponse.json({
      success: true,
      token: newToken,
      publicUrl: publicProfileUrl,
      message: 'New one-time access link generated successfully',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[v0] Error generating link:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate link',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
