import { Wand2 } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Create a SaaS landing page for an AI meeting notes app with pricing and testimonials.',
  'Build a clean portfolio homepage for a robotics engineer with project cards.',
  'Make a dashboard mockup for tracking GPU jobs, usage, costs, and alerts.'
];

type Props = {
  prompt: string;
  loading: boolean;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
};

export function PromptPanel({ prompt, loading, onPromptChange, onGenerate }: Props) {
  return (
    <aside className="prompt-panel">
      <div>
        <p className="eyebrow">Prompt</p>
        <h2>Describe the app you want</h2>
        <p className="muted">MVP supports HTML, CSS, and JavaScript generation with live iframe preview.</p>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Build a modern landing page for..."
        rows={12}
      />

      <button className="button button-primary full" onClick={onGenerate} disabled={loading || prompt.trim().length < 8}>
        <Wand2 size={18} />
        {loading ? 'Generating...' : 'Generate app'}
      </button>

      <div className="examples">
        <p className="eyebrow">Examples</p>
        {EXAMPLE_PROMPTS.map((item) => (
          <button key={item} className="example-card" onClick={() => onPromptChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
}
