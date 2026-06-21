import { Check, Code2, Copy } from 'lucide-react';
import { useState } from 'react';
import type { GeneratedFile } from '../lib/types';

type Props = {
  files: GeneratedFile[];
  activePath: string;
  onActivePathChange: (path: string) => void;
  onFilesChange: (files: GeneratedFile[]) => void;
};

export function CodePanel({ files, activePath, onActivePathChange, onFilesChange }: Props) {
  const [copied, setCopied] = useState(false);
  const activeFile = files.find((file) => file.path === activePath) ?? files[0];

  function updateContent(content: string) {
    if (!activeFile) return;
    onFilesChange(files.map((file) => file.path === activeFile.path ? { ...file, content } : file));
  }

  async function copyCode() {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="code-panel panel-section">
      <div className="pane-toolbar">
        <div className="pane-title"><Code2 size={16} /> Code</div>
        <button className="icon-button" onClick={copyCode} disabled={!activeFile} title="Copy active file">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <div className="file-tabs">
        {files.map((file) => (
          <button
            key={file.path}
            className={file.path === activeFile?.path ? 'active' : ''}
            onClick={() => onActivePathChange(file.path)}
          >
            {file.path}
          </button>
        ))}
      </div>
      {activeFile ? (
        <textarea
          className="code-editor"
          spellCheck={false}
          value={activeFile.content}
          onChange={(event) => updateContent(event.target.value)}
          aria-label={`Edit ${activeFile.path}`}
        />
      ) : (
        <div className="empty-state compact">
          <Code2 size={26} />
          <h3>Generated code appears here</h3>
          <p>HTML, CSS, and JavaScript are editable after generation.</p>
        </div>
      )}
    </section>
  );
}
