// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGame } from '../../state/game';
import { ShareButton } from './ShareButton';

vi.mock('virtual:celik-content', () => ({ scenarios: {}, concepts: [], tactics: [], goals: [] }));
const png = vi.hoisted(() => ({ node: null as HTMLElement | null, opts: null as unknown }));
vi.mock('html-to-image', () => ({
  toPng: async (node: HTMLElement, opts: unknown) => { png.node = node; png.opts = opts; return 'data:image/png;base64,AAAA'; },
}));

afterEach(() => { cleanup(); useGame.getState().reset(); });

describe('Kad Keputusan (W6)', () => {
  it('draws a 1080 × 1350 card with the character name and SIMULASI, then downloads it', async () => {
    HTMLImageElement.prototype.decode = () => Promise.resolve();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<ShareButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Kongsi Kad Keputusan' }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(png.opts).toMatchObject({ width: 1080, height: 1350 });
    expect(png.node?.textContent).toContain('SIMULASI');
    expect(png.node?.textContent).toContain('Aina');
    expect(png.node?.querySelector('input, textarea')).toBeNull();
    const a = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(a.download).toBe('celik-kad-keputusan.png');
    click.mockRestore();
  });
});
