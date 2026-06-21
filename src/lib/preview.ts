import type { GeneratedFile } from './types';

function escapeClosingScript(value: string) {
  return value.replace(/<\/script/gi, '<\\/script');
}

export function buildPreviewDocument(files: GeneratedFile[]): string {
  const html = files.find((file) => file.path === 'index.html')?.content;
  const css = files.find((file) => file.path === 'styles.css')?.content ?? '';
  const js = files.find((file) => file.path === 'script.js')?.content ?? '';

  const fallback = '<!doctype html><html><head><meta charset="UTF-8"><title>Preview</title></head><body><main><h1>Generate your first app</h1></main></body></html>';
  let document = html || fallback;

  const styleTag = `<style data-builderkit>${css}</style>`;
  const scriptTag = `<script type="module" data-builderkit>${escapeClosingScript(js)}</script>`;

  document = document.includes('</head>')
    ? document.replace('</head>', `${styleTag}</head>`)
    : `${styleTag}${document}`;

  document = document.includes('</body>')
    ? document.replace('</body>', `${scriptTag}</body>`)
    : `${document}${scriptTag}`;

  return document;
}
