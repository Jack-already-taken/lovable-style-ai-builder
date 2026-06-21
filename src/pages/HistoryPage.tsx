import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import type { HistoryItem } from '../lib/types';

export function HistoryPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await getToken();
        const response = await fetch('/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load history');
        setItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    loadHistory();
  }, [getToken]);

  return (
    <main className="history-page">
      <section className="page-heading">
        <p className="eyebrow">History</p>
        <h1>Generated apps</h1>
        <p className="muted">Stored prompt and code outputs from Supabase.</p>
      </section>
      {error && <div className="error-box">{error}</div>}
      <div className="history-grid">
        {items.map((item) => (
          <article className="history-card" key={item.id}>
            <p className="muted">{new Date(item.created_at).toLocaleString()}</p>
            <h3>{item.prompt.slice(0, 90)}{item.prompt.length > 90 ? '...' : ''}</h3>
            <p>{item.files.length} files generated</p>
          </article>
        ))}
        {!items.length && !error && <p className="muted">No history yet. Generate your first app.</p>}
      </div>
    </main>
  );
}
