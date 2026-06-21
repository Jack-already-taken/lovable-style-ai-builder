import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { requireUser } from '../lib/auth';
import { json, methodNotAllowed } from '../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { userId } = await requireUser(req);
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
    if (!process.env.STRIPE_PRICE_ID) throw new Error('Missing STRIPE_PRICE_ID');

    const origin = req.headers.origin || process.env.VITE_APP_URL || 'http://localhost:5173';
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: userId,
      metadata: { clerk_user_id: userId }
    });

    return json(res, 200, { url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return json(res, 400, { error: message });
  }
}
