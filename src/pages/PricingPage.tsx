import { Show, SignInButton, useAuth } from '@clerk/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function PricingPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pricing-page">
      <section className="pricing-card">
        <p className="eyebrow">Pricing</p>
        <h1>Builder Pro</h1>
        <p className="price"><span>$20</span>/month</p>
        <p className="muted">Starter subscription plan wired to Stripe Checkout.</p>
        <ul className="pricing-list">
          <li><CheckCircle2 size={18} /> AI web app generations</li>
          <li><CheckCircle2 size={18} /> Prompt and code history</li>
          <li><CheckCircle2 size={18} /> Preview + code split view</li>
          <li><CheckCircle2 size={18} /> Future GitHub export hook</li>
        </ul>
        <Show when="signed-in">
          <button className="button button-primary full" onClick={startCheckout} disabled={loading}>
            {loading ? 'Opening Stripe...' : 'Subscribe with Stripe'}
          </button>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="button button-primary full">Sign in to subscribe</button>
          </SignInButton>
        </Show>
      </section>
    </main>
  );
}
