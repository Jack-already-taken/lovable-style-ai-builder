import type { GeneratedFile } from '../lib/types';

type Props = {
  files: GeneratedFile[];
  activePath: string | null;
  onActivePathChange: (path: string) => void;
};

export function CodePanel({ files, activePath, onActivePathChange }: Props) {
  const activeFile = files.find((file) => file.path === activePath) ?? files[0];

  if (!files.length) {
    return (
      <section className="code-panel empty-state">
        <h3>Code will appear here</h3>
        <p>After generation, switch between HTML, CSS, and JavaScript files.</p>
      </section>
    );
  }

  return (
    <section className="code-panel">
      <div className="file-tabs">
        {files.map((file) => (
          <button
            key={file.path}
            className={file.path === activeFile.path ? 'active' : ''}
            onClick={() => onActivePathChange(file.path)}
          >
            {file.path}
          </button>
        ))}
      </div>
      <pre className="code-block"><code>{activeFile.content}</code></pre>
    </section>
  );
}
