import type { VercelRequest } from '@vercel/node';
import { verifyToken } from '@clerk/backend';

export async function requireUser(req: VercelRequest): Promise<{ userId: string }> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Missing Authorization bearer token');
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('Missing CLERK_SECRET_KEY');
  }

  const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  if (!payload.sub) {
    throw new Error('Invalid Clerk token');
  }

  return { userId: payload.sub };
}
