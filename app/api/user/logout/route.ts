import { type NextRequest, NextResponse } from 'next/server';
import { invalidateViewToken } from '@/lib/url-utils';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invalidated = await invalidateViewToken(token);

    if (invalidated) {
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to logout',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('[v0] User logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 },
    );
  }
}
