/**
 * Finalist features (D45). On in `npm run dev`, unit tests and Playwright; off in a plain production build, so the
 * live site never shows unfinished screens. A9 turns it on with VITE_FINALIST = "1" in netlify.toml.
 */
export const FINALIST: boolean = import.meta.env.DEV || import.meta.env.VITE_FINALIST === '1';
