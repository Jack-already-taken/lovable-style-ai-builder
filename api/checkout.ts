import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { requireUser } from '../lib/auth';
import { ApiError, handleApiError } from '../lib/errors';
import { json, methodNotAllowed } from '../lib/http';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { userId } = await requireUser(req);
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      throw new ApiError(503, 'Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID.');
    }

    const origin = req.headers.origin || process.env.VITE_APP_URL || 'http://localhost:3000';
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();
    const { data: billing, error } = await supabase
      .from('billing_customers')
      .select('stripe_customer_id, subscription_status')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    if (error) throw error;

    if (billing?.subscription_status && ['active', 'trialing'].includes(billing.subscription_status)) {
      throw new ApiError(409, 'You already have an active subscription. Use Manage billing instead.');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: billing?.stripe_customer_id || undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: userId,
      metadata: { clerk_user_id: userId },
      subscription_data: { metadata: { clerk_user_id: userId } },
      allow_promotion_codes: true
    });

    if (!session.url) throw new ApiError(502, 'Stripe did not return a Checkout URL.');
    return json(res, 200, { url: session.url });
  } catch (error) {
    return handleApiError(res, error);
  }
}
