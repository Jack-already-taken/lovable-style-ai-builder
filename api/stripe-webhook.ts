import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { handleApiError, ApiError } from '../lib/errors';
import { json, methodNotAllowed } from '../lib/http';
import { readRawBody } from '../lib/readRawBody';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

function subscriptionRecord(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return {
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    price_id: item?.price.id || null,
    current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new ApiError(500, 'Stripe webhook environment variables are missing.');
    }
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) throw new ApiError(400, 'Missing Stripe signature.');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(await readRawBody(req), signature, process.env.STRIPE_WEBHOOK_SECRET);
    const supabase = getSupabaseAdmin();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerk_user_id || session.client_reference_id;
      if (clerkUserId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        const { error } = await supabase.from('billing_customers').upsert({
          clerk_user_id: clerkUserId,
          ...subscriptionRecord(subscription)
        }, { onConflict: 'clerk_user_id' });
        if (error) throw error;
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkUserId = subscription.metadata?.clerk_user_id;
      const record = subscriptionRecord(subscription);
      const query = clerkUserId
        ? supabase.from('billing_customers').upsert({ clerk_user_id: clerkUserId, ...record }, { onConflict: 'clerk_user_id' })
        : supabase.from('billing_customers').update(record).eq('stripe_customer_id', record.stripe_customer_id);
      const { error } = await query;
      if (error) throw error;
    }

    return json(res, 200, { received: true });
  } catch (error) {
    return handleApiError(res, error);
  }
}
