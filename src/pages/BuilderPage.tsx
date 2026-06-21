import { useAuth } from '@clerk/react';
import { useState } from 'react';
import { CodePanel } from '../components/CodePanel';
import { PaywallNotice } from '../components/PaywallNotice';
import { PreviewPane } from '../components/PreviewPane';
import { PromptPanel } from '../components/PromptPanel';
import type { GeneratedFile, GenerationResponse } from '../lib/types';

export function BuilderPage() {
  const { getToken } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [appName, setAppName] = useState('Untitled app');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = (await response.json()) as GenerationResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      setFiles(data.files);
      setAppName(data.appName);
      setActivePath(data.files[0]?.path ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="builder-page">
      <PromptPanel prompt={prompt} loading={loading} onPromptChange={setPrompt} onGenerate={generate} />
      <section className="workspace">
        <div className="workspace-topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{appName}</h1>
          </div>
        </div>
        <PaywallNotice />
        {error && <div className="error-box">{error}</div>}
        <div className="split-view">
          <PreviewPane files={files} />
          <CodePanel files={files} activePath={activePath} onActivePathChange={setActivePath} />
        </div>
      </section>
    </main>
  );
}
