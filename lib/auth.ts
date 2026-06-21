import { verifyToken } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';
import { ApiError } from './errors';

export async function requireUser(req: VercelRequest): Promise<{ userId: string }> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) throw new ApiError(401, 'Sign in is required.');
  if (!process.env.CLERK_SECRET_KEY) throw new ApiError(500, 'Missing CLERK_SECRET_KEY.');

  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    if (!payload.sub) throw new ApiError(401, 'Invalid Clerk session token.');
    return { userId: payload.sub };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Your session is invalid or expired.');
  }
}
