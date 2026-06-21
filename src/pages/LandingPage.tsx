import { Show, SignUpButton } from '@clerk/react';
import { ArrowRight, Code2, Eye, GitBranch, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI website builder skeleton</p>
          <h1>Turn a prompt into a live web app preview and editable code.</h1>
          <p className="hero-subtitle">
            A GitHub-ready starter for an AI app builder: prompt input, split preview/code UI,
            auth, Supabase history, Stripe subscription checkout, and Vercel deployment.
          </p>
          <div className="hero-actions">
            <Show when="signed-in">
              <Link className="button button-primary" to="/app">
                Open builder <ArrowRight size={18} />
              </Link>
            </Show>
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="button button-primary">
                  Start building <ArrowRight size={18} />
                </button>
              </SignUpButton>
            </Show>
            <Link className="button button-secondary" to="/pricing">View pricing</Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="fake-browser">
            <span /> <span /> <span />
          </div>
          <div className="fake-builder-grid">
            <div className="fake-sidebar">Prompt</div>
            <div className="fake-preview">Live preview</div>
            <div className="fake-code">Code view</div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {[
          { icon: <Eye />, title: 'Preview', body: 'Render generated HTML/CSS/JS inside a sandboxed iframe.' },
          { icon: <Code2 />, title: 'Code', body: 'Expose generated files in a right-side code panel.' },
          { icon: <GitBranch />, title: 'History', body: 'Store prompts and file outputs in Supabase for later retrieval.' },
          { icon: <Rocket />, title: 'Deploy', body: 'Ship on Vercel with serverless API routes and custom domains.' }
        ].map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span>{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
