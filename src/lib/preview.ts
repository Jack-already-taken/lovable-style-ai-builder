import type { GeneratedFile } from './types';

export function buildPreviewDocument(files: GeneratedFile[]): string {
  const html = files.find((file) => file.path.endsWith('index.html'))?.content;
  const css = files.find((file) => file.path.endsWith('.css'))?.content ?? '';
  const js = files.find((file) => file.path.endsWith('.js'))?.content ?? '';

  const fallbackHtml = `<!doctype html><html><head><title>Preview</title></head><body><div id="root"></div></body></html>`;
  const base = html || fallbackHtml;

  return base
    .replace('</head>', `<style>${css}</style></head>`)
    .replace('</body>', `<script type="module">${js}</script></body>`);
}
