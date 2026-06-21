import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { readRawBody } from '../lib/readRawBody';
import { json, methodNotAllowed } from '../lib/http';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) throw new Error('Missing Stripe signature');

    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    const supabase = getSupabaseAdmin();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerk_user_id || session.client_reference_id;
      if (clerkUserId && session.customer) {
        await supabase.from('billing_customers').upsert({
          clerk_user_id: clerkUserId,
          stripe_customer_id: String(session.customer),
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        });
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer);
      const primaryItem = subscription.items.data[0];
      const periodEnd = primaryItem?.current_period_end;

      await supabase
        .from('billing_customers')
        .update({
          subscription_status: subscription.status,
          price_id: primaryItem?.price.id ?? null,
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', customerId);
    }

    return json(res, 200, { received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error';
    return json(res, 400, { error: message });
  }
}
