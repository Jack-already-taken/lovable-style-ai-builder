import { Show, SignUpButton } from '@clerk/react';
import { ArrowRight, Braces, CloudUpload, Database, LockKeyhole, MessageSquareText, Play, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: MessageSquareText, title: 'Prompt to product', body: 'Describe a site, then refine it with follow-up instructions.' },
  { icon: Braces, title: 'Preview and code', body: 'See the rendered design and edit the generated HTML, CSS, and JavaScript side by side.' },
  { icon: Database, title: 'Persistent history', body: 'Projects and every generation are stored in Supabase.' },
  { icon: CloudUpload, title: 'Deploy and export', body: 'Publish generated sites to Vercel or export them into GitHub.' }
];

export function LandingPage() {
  return (
    <main>
      <section className="landing-hero">
        <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
        <div className="hero-badge"><Zap size={14} /> AI web-app builder starter</div>
        <h1>Build a polished website from a conversation.</h1>
        <p>
          BuilderKit turns a plain-English prompt into a working site, editable source code, persistent project history,
          and a deployable preview—using Clerk, Anthropic, Supabase, Stripe, and Vercel.
        </p>
        <div className="hero-actions">
          <Show when="signed-in">
            <Link className="button button-primary button-large" to="/app">Open builder <ArrowRight size={18} /></Link>
          </Show>
          <Show when="signed-out">
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <button className="button button-primary button-large">Start building <ArrowRight size={18} /></button>
            </SignUpButton>
          </Show>
          <a className="button button-secondary button-large" href="#demo"><Play size={17} /> See workflow</a>
        </div>
        <div className="trust-row"><LockKeyhole size={15} /> API keys stay server-side. Generated previews run in a sandboxed iframe.</div>
      </section>

      <section className="product-demo" id="demo">
        <div className="demo-window">
          <div className="demo-window-bar"><span /><span /><span /><div>builderkit.app/app</div></div>
          <div className="demo-layout">
            <div className="demo-sidebar">
              <div className="demo-line wide" /><div className="demo-line" />
              <div className="demo-prompt">Build a modern analytics dashboard for AI agents…</div>
              <div className="demo-button" />
            </div>
            <div className="demo-preview">
              <div className="demo-card hero-card-mini"><div /><div /><div /></div>
              <div className="demo-cards"><div /><div /><div /></div>
            </div>
            <div className="demo-code"><pre>{`<main class="dashboard">\n  <h1>Agent overview</h1>\n  <section class="metrics">\n    ...\n  </section>\n</main>`}</pre></div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading"><span>Everything needed for the demo</span><h2>One coherent frontend and backend flow.</h2></div>
        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article className="feature-card" key={title}><Icon size={22} /><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>

      <section className="stack-strip">
        <span>Vite + React</span><span>Clerk</span><span>Anthropic</span><span>Supabase</span><span>Stripe</span><span>Vercel</span>
      </section>
    </main>
  );
}
