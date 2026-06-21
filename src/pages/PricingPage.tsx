import { Show, SignInButton, useAuth } from '@clerk/react';
import { Check, LoaderCircle, Settings2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { BillingStatus } from '../lib/types';

export function PricingPage() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getToken().then((token) => token ? apiFetch<BillingStatus>('/api/billing-status', getToken).then(setStatus).catch(() => undefined) : undefined);
  }, [getToken]);

  async function redirect(endpoint: '/api/checkout' | '/api/billing-portal') {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ url: string }>(endpoint, getToken, { method: 'POST' });
      window.location.href = data.url;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Billing request failed');
      setLoading(false);
    }
  }

  const subscribed = status?.hasAccess && ['active', 'trialing'].includes(status.status);

  return (
    <main className="pricing-page">
      <div className="pricing-heading"><p className="eyebrow">Simple pricing</p><h1>Build, edit, and publish from one workspace.</h1><p>Stripe-hosted Checkout keeps card details out of this application.</p></div>
      <div className="pricing-card">
        <div className="pricing-card-header"><div><span className="plan-badge"><Sparkles size={14} /> Pro</span><h2>Builder Pro</h2></div><div className="price"><strong>$20</strong><span>/month</span></div></div>
        <p className="pricing-description">For testing the full prompt-to-deployment workflow.</p>
        <ul className="pricing-list">
          {['AI app generation and follow-up changes', 'Editable preview and source code', 'Supabase project history', 'Vercel deployment and GitHub export', 'Stripe billing portal'].map((item) => <li key={item}><Check size={17} /> {item}</li>)}
        </ul>
        {error && <div className="error-box">{error}</div>}
        <Show when="signed-in">
          {subscribed ? (
            <button className="button button-secondary full" disabled={loading} onClick={() => redirect('/api/billing-portal')}>
              {loading ? <LoaderCircle className="spin" size={17} /> : <Settings2 size={17} />} Manage billing
            </button>
          ) : (
            <button className="button button-primary full" disabled={loading} onClick={() => redirect('/api/checkout')}>
              {loading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} Start subscription
            </button>
          )}
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal" fallbackRedirectUrl="/pricing"><button className="button button-primary full">Sign in to subscribe</button></SignInButton>
        </Show>
        <p className="pricing-footnote">Use Stripe test mode during development. Billing enforcement is controlled by an environment flag.</p>
      </div>
    </main>
  );
}
