import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, summary, visibleText } from '../../../dashboard/testing';
import { TrendCard } from './trend-card';

const line = (month: string, expense: number, entries = 1) => ({ month, income: 0, expense, saving: 0, balance: -expense, entries });
const trend = summary({ months: [line('2026-08', 120000), line('2026-10', 300000), line('2026-11', 540000)] });

describe('TrendCard (spec 008 REQ-9.8)', () => {
  it('always draws six bars, the months without entries at zero', async () => {
    await renderPart(TrendCard, { summary: trend, month: '2026-11', currency: TND });
    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect([...document.querySelectorAll('.ui-trend-bars__value')].map((text) => text.textContent?.trim())).toEqual([
      expect.stringMatching(/^0\b/),
      expect.stringMatching(/^0\b/),
      expect.stringMatching(/^120\b/),
      expect.stringMatching(/^0\b/),
      expect.stringMatching(/^300\b/),
      expect.stringMatching(/^540\b/),
    ]);
  });

  it('highlights the selected month only', async () => {
    await renderPart(TrendCard, { summary: trend, month: '2026-11', currency: TND });
    const current = document.querySelectorAll('.ui-trend-bars__bar--current');
    expect(current).toHaveLength(1);
    expect(screen.getAllByRole('button').at(-1)?.getAttribute('aria-current')).toBe('true');
  });

  it('shows the average over the months that have entries', async () => {
    await renderPart(TrendCard, { summary: trend, month: '2026-11', currency: TND });
    expect(visibleText()).toContain('Moyenne : 320');
  });

  it('shows no average without any entry', async () => {
    await renderPart(TrendCard, { summary: summary(), month: '2026-11', currency: TND });
    expect(visibleText()).not.toContain('Moyenne');
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('opens the dashboard of the selected month', async () => {
    await renderPart(TrendCard, { summary: trend, month: '2026-11', currency: TND });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await userEvent.click(screen.getAllByRole('button')[4]);
    expect(navigate).toHaveBeenCalledWith(['/analyse'], { queryParams: { mois: '2026-10' } });
  });

  it('shows loading and error states with a retry', async () => {
    const view = await renderPart(TrendCard, { summary: null, month: '2026-11', currency: TND, status: 'loading' });
    expect(screen.getByRole('status')).toBeTruthy();
    view.fixture.componentRef.setInput('status', 'error');
    view.detectChanges();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
  });
});
