import { useEffect } from 'react';
import { applyPreset, DEMO_PRESETS, isDemoScene } from './demo';
import { useT } from './i18n';
import { replaceRoute } from './router';

/**
 * Route `#/demo/:scene`: applies the preset, then replaces the URL with the preset's screen (unknown scene: home).
 * Runs after the save has loaded (App renders routes only when ready), so the preset is what gets autosaved.
 */
export function DemoScene({ params }: { params: Record<string, string> }) {
  const t = useT();
  const scene = params.scene ?? '';
  useEffect(() => {
    replaceRoute(applyPreset(scene) && isDemoScene(scene) ? DEMO_PRESETS[scene].route : '/home');
  }, [scene]);
  return (
    <div data-screen="demo" className="flex flex-1 items-center justify-center">
      <p role="status" className="sr-only">{t('demo.loading')}</p>
    </div>
  );
}
