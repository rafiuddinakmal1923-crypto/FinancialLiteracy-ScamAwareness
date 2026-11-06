import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Kancil } from '../ui/Kancil';
import { useT } from './i18n';

export function ErrorScreen() {
  const t = useT();
  const restart = () => {
    window.location.hash = '#/home';
    window.location.reload();
  };
  return (
    <div data-screen="error" className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <Kancil mood="worried" size={150} decorative />
      <h1 className="font-display text-2xl font-bold text-ink">{t('error.title')}</h1>
      <p className="max-w-[28ch] text-base text-ink-soft">{t('error.body')}</p>
      <button
        type="button"
        onClick={restart}
        className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-kancil px-6 text-base font-semibold text-ink"
      >
        <RotateCcw aria-hidden size={20} strokeWidth={1.75} />
        {t('error.restart')}
      </button>
    </div>
  );
}

/** Wraps one route; any render error shows ErrorScreen instead of a blank phone. */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Route crashed', error, info.componentStack); }
  render() { return this.state.failed ? <ErrorScreen /> : this.props.children; }
}
