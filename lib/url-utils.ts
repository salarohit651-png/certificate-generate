import { connectDB } from '@/lib/mongodb';
import AccessLink from '@/models/AccessLink';

export function getLoginDomain(): string {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');
  return `${baseUrl}/user/profile`;
}

export function getPublicProfileLink(registrationNumber: string): string {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');
  const token = generateViewToken(registrationNumber);
  return `${baseUrl}/user/${token}`;
}

export function generateViewToken(registrationNumber: string): string {
  // Create a simple base64 encoded token with timestamp for basic security
  const data = {
    regNum: registrationNumber,
    timestamp: Date.now(),
  };

  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export async function decodeViewToken(token: string): Promise<string | null> {
  try {
    await connectDB();

    // Check if token exists in database and is valid
    const accessLink = await AccessLink.findOne({ token });

    if (!accessLink) {
      return null;
    }

    if (accessLink.isUsed) {
      return null;
    }

    if (accessLink.expiresAt < new Date()) {
      return null;
    }

    // Don't mark as used - allow multiple accesses until logout
    return accessLink.registrationNumber;
  } catch (error) {
    console.error('Error validating view token:', error);

    // Fallback to old token format for backward compatibility
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');

      if (decoded.includes('-')) {
        // New format: registrationNumber-timestamp-randomBytes
        const parts = decoded.split('-');
        if (parts.length >= 2) {
          return parts[0]; // Return registration number
        }
      } else {
        // Old format: JSON
        const data = JSON.parse(decoded);

        // Check if token is not older than 30 days (optional security measure)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (data.timestamp < thirtyDaysAgo) {
          return null;
        }

        return data.regNum;
      }

      return null;
    } catch (fallbackError) {
      console.error('Error decoding view token (fallback):', fallbackError);
      return null;
    }
  }
}

export async function invalidateViewToken(token: string): Promise<boolean> {
  try {
    await connectDB();

    const accessLink = await AccessLink.findOne({ token });

    if (!accessLink) {
      return false;
    }

    // Mark token as used (invalidated)
    accessLink.isUsed = true;
    accessLink.usedAt = new Date();
    await accessLink.save();

    return true;
  } catch (error) {
    console.error('Error invalidating view token:', error);
    return false;
  }
}
