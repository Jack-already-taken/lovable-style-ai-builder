import { Link } from 'react-router-dom';

export function PaywallNotice() {
  return (
    <div className="notice">
      <strong>Billing hook placeholder:</strong> protect generation by checking Stripe subscription state in <code>/api/generate</code>.{' '}
      <Link to="/pricing">Open pricing</Link>
    </div>
  );
}
