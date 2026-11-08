// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyPreset } from '../../shell/demo';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { ReportCard } from './ReportCard';

beforeEach(() => {
  useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
  applyPreset('report');
  window.location.hash = '#/semester/rapor';
});
afterEach(cleanup);

const fill = (el: HTMLElement) => (el.firstElementChild as HTMLElement).className;

describe('ReportCard', () => {
  it('shows the title, a grade stamp A-D and the score', () => {
    render(<ReportCard />);
    expect(screen.getByRole('heading', { name: 'Laporan semester' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /^Gred semester: [ABCD], skor [\d.]+ daripada 100$/ })).toBeTruthy();
    expect(screen.getByText(/^Skor [\d.]+ \/ 100$/)).toBeTruthy();
    expect(screen.queryByText('Semester belum tamat', { exact: false })).toBeNull();
  });
  it('shows the money, emergency, scam, flag and judgement rows', () => {
    render(<ReportCard />);
    for (const label of ['Duit tinggal', 'Nilai Labur', 'Dana kecemasan', 'Scam dielak', 'Bendera merah dijumpai', 'Ketepatan pertimbangan']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText('RM2,100')).toBeTruthy();
    expect(screen.getByText('RM250')).toBeTruthy();
    expect(screen.getByText(/Ya \(RM300\)/)).toBeTruthy();
    expect(screen.getByText('3 dielak, 1 terjebak')).toBeTruthy();
  });
  it('shows 6 amber Celik bars and 7 indigo Imuniti bars with their names and values', () => {
    render(<ReportCard />);
    const celik = within(screen.getByRole('group', { name: 'Celik Kewangan setiap konsep' })).getAllByRole('progressbar');
    const imuniti = within(screen.getByRole('group', { name: 'Imuniti setiap helah' })).getAllByRole('progressbar');
    expect(celik).toHaveLength(6);
    expect(imuniti).toHaveLength(7);
    celik.forEach((b) => expect(fill(b)).toContain('bg-kancil'));
    imuniti.forEach((b) => expect(fill(b)).toContain('bg-indigo'));
    expect(screen.getByRole('progressbar', { name: 'Dana Kecemasan' }).getAttribute('aria-valuenow')).toBe('74');
    expect(screen.getByText('74%')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Bayar Dulu' })).toBeTruthy();
  });
  it('names the weakest item and Latih ini opens Cek Harian', () => {
    render(<ReportCard />);
    expect(screen.getByText(/^Paling perlu dilatih: /)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Latih ini' }));
    expect(window.location.hash).toBe('#/harian');
  });
  it('shows the Rekod note when Rekod is not Bersih', () => {
    useGame.getState().set({ meters: { ...useGame.getState().meters, rekod: 'Disiasat' } });
    render(<ReportCard />);
    expect(screen.getByText(/Rekod kamu: Disiasat/)).toBeTruthy();
  });
  it('shows no Rekod note when Rekod is Bersih', () => {
    render(<ReportCard />);
    expect(screen.queryByText(/Rekod kamu/)).toBeNull();
  });
  it('says Semester belum tamat and still renders numbers mid-semester', () => {
    useGame.getState().set({ week: 6 });
    render(<ReportCard />);
    expect(screen.getByText(/Semester belum tamat/)).toBeTruthy();
    expect(screen.getByText('Duit tinggal')).toBeTruthy();
  });
  it('renders with no results without NaN or undefined', () => {
    useGame.getState().reset();
    useGame.getState().set({ onboarded: true });
    const { container } = render(<ReportCard />);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
    expect(screen.getByText(/Semester belum tamat/)).toBeTruthy();
  });
  it('Mula semester baru asks first, then resets the game', () => {
    render(<ReportCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Mula semester baru' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tidak, kekal' }));
    expect(useGame.getState().week).toBe(12);
    fireEvent.click(screen.getByRole('button', { name: 'Mula semester baru' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ya, mula baru' }));
    expect(useGame.getState().week).toBe(0);
    expect(useGame.getState().results).toEqual([]);
  });
  it('opens Papan Markah from the report card (SRS 5.2b)', () => {
    render(<ReportCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat Papan Markah' }));
    expect(window.location.hash).toBe('#/papan');
  });
  // Kad Keputusan (W6, FR-85) sits on the report card when the finalist screens are on (D45); tests run with them on.
  it('Kembali goes home; the share button is Kad Keputusan', () => {
    render(<ReportCard />);
    expect(screen.getAllByRole('button', { name: /kongsi|share/i }).map((b) => b.textContent)).toEqual(['Kongsi Kad Keputusan']);
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(window.location.hash).toBe('#/home');
  });
});
