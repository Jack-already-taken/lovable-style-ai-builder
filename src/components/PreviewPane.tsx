import { ExternalLink, Monitor, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildPreviewDocument } from '../lib/preview';
import type { GeneratedFile } from '../lib/types';

type Props = {
  files: GeneratedFile[];
};

export function PreviewPane({ files }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const srcDoc = useMemo(() => buildPreviewDocument(files), [files, refreshKey]);

  return (
    <section className="preview-pane panel-section">
      <div className="pane-toolbar">
        <div className="pane-title"><Monitor size={16} /> Design preview</div>
        <div className="toolbar-actions">
          <button className="icon-button" onClick={() => setRefreshKey((value) => value + 1)} title="Refresh preview">
            <RefreshCw size={16} />
          </button>
          <button
            className="icon-button"
            disabled={!files.length}
            title="Open preview in a new tab"
            onClick={() => {
              const blob = new Blob([srcDoc], { type: 'text/html' });
              window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
      <div className="browser-chrome">
        <span /><span /><span />
        <div className="address-bar">builderkit-preview.local</div>
      </div>
      <iframe
        key={refreshKey}
        title="Generated app preview"
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={srcDoc}
      />
    </section>
  );
}
