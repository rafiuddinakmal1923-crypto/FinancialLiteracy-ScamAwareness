import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { PhoneFrame } from './shell/PhoneFrame';
import { RouteErrorBoundary } from './shell/ErrorScreen';
import { FALLBACK_PATH, ROUTE_TABLE } from './shell/routes';
import { replaceRoute, resolveRoute, useRoute } from './shell/router';
import { flushNow, loadAll, startAutoSave } from './state/persist';
import { useGame } from './state/game';
import { useSettings } from './state/settings';

/** Loads the save, then starts autosave; flushes on pagehide / tab hidden. */
function useBoot(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;
    const flush = () => { void flushNow(); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    void loadAll().finally(() => {
      if (cancelled) return;
      stop = startAutoSave();
      window.addEventListener('pagehide', flush);
      document.addEventListener('visibilitychange', onVisibility);
      setReady(true);
    });
    return () => {
      cancelled = true;
      stop?.();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return ready;
}

export default function App() {
  const ready = useBoot();
  const { path } = useRoute();
  const lang = useSettings((s) => s.lang);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const onboarded = useGame((s) => s.onboarded);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.toggleAttribute('data-reduced-motion', reducedMotion);
  }, [lang, reducedMotion]);

  const match = resolveRoute(ROUTE_TABLE, path);
  const redirect = !match ? FALLBACK_PATH : match.route.needsGame && !onboarded ? '/' : null;

  useEffect(() => {
    if (ready && redirect) replaceRoute(redirect);
  }, [ready, redirect]);

  if (!ready || !match || redirect) return <div className="desk min-h-dvh" />;

  const { route, params } = match;
  const Screen = route.component;
  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <PhoneFrame
        statusBar={route.statusBar ?? null}
        tipKey={route.tip}
        mood={route.mood}
      >
        <RouteErrorBoundary key={path}>
          <Screen params={params} />
        </RouteErrorBoundary>
      </PhoneFrame>
    </MotionConfig>
  );
}
