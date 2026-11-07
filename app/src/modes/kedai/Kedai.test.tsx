// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ShopItem } from '../../engine/types';
import { useGame } from '../../state/game';
import { Kedai } from './Kedai';

const ITEMS: ShopItem[] = vi.hoisted(() => [
  { id: 'snek', name: { ms: 'Snek malam' }, pot: 'kehendak', effect: 'none', tip: { ms: 'Sedap, tapi cepat habis.' } },
  { id: 'basikal', name: { ms: 'Basikal terpakai' }, pot: 'kehendak', effect: 'transport', tip: { ms: 'Jimat tambang.' } },
  { id: 'telefon', name: { ms: 'Telefon baharu' }, pot: 'kehendak', effect: 'instalment', tip: { ms: 'Ansuran nampak murah.' } },
] as ShopItem[]);
vi.mock('virtual:celik-content', () => ({ shop: ITEMS }));

afterEach(() => { cleanup(); useGame.getState().reset(); window.location.hash = ''; });

const card = (id: string) => screen.getByRole('article', { name: ITEMS.find((i) => i.id === id)!.name.ms });

describe('Kedai Kampus (W3)', () => {
  it('shows every item with its balance.ts price, pot and tip', () => {
    render(<Kedai />);
    expect(within(card('snek')).getByText('RM15')).toBeTruthy();
    expect(within(card('snek')).getByText('Kehendak')).toBeTruthy();
    expect(within(card('basikal')).getByText('Jimat tambang.')).toBeTruthy();
    expect(within(card('telefon')).getByText('RM110 × 12 bulan')).toBeTruthy();
  });

  it('disables Beli when Duit is short', () => {
    useGame.setState({ meters: { ...useGame.getState().meters, duit: 100 } });
    render(<Kedai />);
    expect((within(card('basikal')).getByRole('button', { name: 'Beli' }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(card('basikal')).getByText('Duit tak cukup')).toBeTruthy();
    expect((within(card('snek')).getByRole('button', { name: 'Beli' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('a cash item opens a confirm sheet; Sahkan calls buyItem, Tak jadi does not', () => {
    const spy = vi.spyOn(useGame.getState(), 'buyItem');
    render(<Kedai />);
    fireEvent.click(within(card('snek')).getByRole('button', { name: 'Beli' }));
    const sheet = screen.getByRole('dialog', { name: 'Beli Snek malam?' });
    expect(within(sheet).getByText('RM15 dibayar dari Duit, dikira sebagai Kehendak.')).toBeTruthy();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Tak jadi' }));
    expect(spy).not.toHaveBeenCalled();
    fireEvent.click(within(card('snek')).getByRole('button', { name: 'Beli' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sahkan' }));
    expect(spy).toHaveBeenCalledWith('snek');
    spy.mockRestore();
  });

  it('an instalment item opens Kos Sebenar first, then the confirm sheet leads with the real total', () => {
    const view = render(<Kedai />);
    fireEvent.click(within(card('telefon')).getByRole('button', { name: 'Beli ansuran' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.location.hash).toBe('#/kalkulator?preset=kedai-telefon&back=/kedai');
    view.unmount();
    render(<Kedai />);
    const sheet = screen.getByRole('dialog', { name: 'Beli Telefon baharu?' });
    expect(within(sheet).getByText('Jumlah sebenar: RM1,320')).toBeTruthy();
    expect(within(sheet).getByText(/Harga tunai RM1,200, jadi ansuran ini kos RM120 lebih/)).toBeTruthy();
  });

  it('a bought item shows as bought; a purchase over RM100 offers Mesin Masa', () => {
    // A3 makes buyItem record the purchase; here the store does it so the screen can be checked now.
    const real = useGame.getState().buyItem;
    useGame.setState({
      buyItem: (id: string) => {
        useGame.setState({ purchases: [...useGame.getState().purchases, { item: id, week: 0 }] });
        return { state: { meters: useGame.getState().meters, week: 0, purchases: useGame.getState().purchases } };
      },
    });
    render(<Kedai />);
    fireEvent.click(within(card('basikal')).getByRole('button', { name: 'Beli' }));
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Sahkan' })); });
    expect(within(card('basikal')).getByText('Sudah dibeli')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Buka Mesin Masa' }));
    expect(window.location.hash).toBe('#/kalkulator/masa?back=/kedai');
    useGame.setState({ buyItem: real });
  });
});
