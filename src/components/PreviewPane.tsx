import type { GeneratedFile } from '../lib/types';
import { buildPreviewDocument } from '../lib/preview';

type Props = {
  files: GeneratedFile[];
};

export function PreviewPane({ files }: Props) {
  if (!files.length) {
    return (
      <section className="preview-pane empty-state">
        <h3>Preview will appear here</h3>
        <p>Generated apps render inside a sandboxed iframe.</p>
      </section>
    );
  }

  return (
    <section className="preview-pane">
      <iframe
        title="Generated app preview"
        sandbox="allow-scripts"
        srcDoc={buildPreviewDocument(files)}
      />
    </section>
  );
}
