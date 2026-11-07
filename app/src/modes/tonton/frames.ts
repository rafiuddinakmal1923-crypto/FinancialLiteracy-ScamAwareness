// Explainer frame files (assets/explainers/*.svg, Aimar's D5) as bundled URLs, keyed by name without ".svg".
const files = import.meta.glob('../../../../assets/explainers/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const FRAME_URL: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.svg'.length), url]),
);
