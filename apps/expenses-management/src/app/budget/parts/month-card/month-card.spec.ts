import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../../public/i18n/fr.json';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { forecast } from '../../support/forecast';
import { MonthCard } from './month-card';

const inputs = (income: number | null = 2800000, overrides: Record<string, unknown> = {}) => ({
  forecast: forecast(income, 2500000, 200000),
  actual: 1350000,
  left: 900000,
  receivedIncome: 2800000,
  position: 'current',
  daysLeft: 7,
  currency: TND,
  ...overrides,
});

const signed = (minor: number) => formatMinor(minor, TND, { signed: true });
const figure = () => document.querySelector('.month__figure')?.textContent?.trim() ?? null;
const radio = (name: string) => screen.getByRole('radio', { name });
const toggle = () => screen.getByRole('button', { name: new RegExp(`${fr.budget.month.showDetail}|${fr.budget.month.hideDetail}`) });
const showReal = () => userEvent.click(radio(fr.budget.month.real));
const check = () => screen.queryByRole('img', { name: fr.budget.month.receivedFull });

describe('MonthCard', () => {
  it('opens on the plan and switches to the actual view', async () => {
    await renderPart(MonthCard, inputs());
    expect(radio(fr.budget.month.plan).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('heading', { name: fr.budget.forecast.title })).toBeTruthy();
    await showReal();
    expect(radio(fr.budget.month.real).getAttribute('aria-checked')).toBe('true');
    expect(radio(fr.budget.month.plan).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('heading', { name: fr.budget.table.left })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: fr.budget.forecast.title })).toBeNull();
  });

  it('shows a signed remainder, the balanced badge, the bar and its legend', async () => {
    await renderPart(MonthCard, inputs());
    expect(figure()).toBe(signed(100000));
    expect(screen.getByText(fr.budget.forecast.balanced)).toBeTruthy();
    expect(screen.getByRole('img', { name: /Dépenses prévues/ }).getAttribute('aria-label')).toContain(signed(100000));
    const legend = Array.from(document.querySelectorAll('.month__legend li'), (item) => item.textContent?.trim().split(' ')[0]);
    expect(legend).toEqual([fr.budget.month.legend.lines, fr.budget.month.legend.saving, fr.budget.month.legend.rest]);
  });

  it('is balanced at exactly zero', async () => {
    await renderPart(MonthCard, inputs(2700000));
    expect(figure()).toBe(signed(0));
    expect(screen.getByText(fr.budget.forecast.balanced)).toBeTruthy();
  });

  it('shows the overflow with an icon and no remainder segment when above the income', async () => {
    await renderPart(MonthCard, inputs(2550000));
    expect(figure()).toBe(signed(-150000));
    expect(screen.getByText(fr.budget.forecast.over).querySelector('ui-icon')).toBeTruthy();
    expect(document.querySelector('.month__overflow')).toBeTruthy();
    expect(document.querySelector('.month__bar .month__segment--rest')).toBeNull();
  });

  it('keeps the detail closed until asked, then edits income and saving from it', async () => {
    const editIncome = vi.fn();
    const editSaving = vi.fn();
    await renderPart(MonthCard, inputs(), { editIncome, editSaving });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /Revenu prévu/ })).toBeNull();
    await userEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().textContent).toContain(fr.budget.month.hideDetail);
    await userEvent.click(screen.getByRole('button', { name: /Revenu prévu/ }));
    await userEvent.click(screen.getByRole('button', { name: /Épargne prévue/ }));
    expect(editIncome).toHaveBeenCalled();
    expect(editSaving).toHaveBeenCalled();
  });

  it('opens the detail when an amount is refused', async () => {
    await renderPart(MonthCard, inputs(2800000, { savingError: 'Montant trop élevé' }));
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Montant trop élevé')).toBeTruthy();
  });

  it('asks for the expected income instead of a figure', async () => {
    const editIncome = vi.fn();
    await renderPart(MonthCard, inputs(null), { editIncome });
    expect(screen.getByText(fr.budget.forecast.noIncome)).toBeTruthy();
    expect(figure()).toBeNull();
    expect(document.querySelector('.month__bar')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: fr.budget.forecast.addIncome }));
    expect(editIncome).toHaveBeenCalled();
  });

  it('shows what is left, the meter, the spent line and the days left', async () => {
    await renderPart(MonthCard, inputs());
    await showReal();
    expect(figure()).toBe(formatMinor(900000, TND));
    expect(screen.getByRole('meter', { name: fr.budget.month.meter })).toBeTruthy();
    expect(visibleText()).toContain('dépensés · 50 %');
    expect(visibleText()).toContain('7 j restants');
    expect(screen.queryByText(fr.dashboard.hero.exhausted)).toBeNull();
  });

  it('flags an exhausted budget with an icon', async () => {
    await renderPart(MonthCard, inputs(2800000, { actual: 2700000, left: 0 }));
    await showReal();
    expect(screen.getByText(fr.dashboard.hero.exhausted).querySelector('ui-icon')).toBeTruthy();
  });

  it('says a past month is closed', async () => {
    await renderPart(MonthCard, inputs(2800000, { position: 'past', daysLeft: null }));
    await showReal();
    expect(visibleText()).toContain(fr.budget.month.closed);
    expect(visibleText()).not.toContain('restants');
  });

  it('adds nothing for a future month', async () => {
    await renderPart(MonthCard, inputs(2800000, { position: 'future', daysLeft: null }));
    await showReal();
    expect(visibleText()).not.toContain(fr.budget.month.closed);
    expect(visibleText()).not.toContain('restants');
  });

  it('checks the income received in full, in both views', async () => {
    await renderPart(MonthCard, inputs());
    expect(visibleText()).toContain(fr.budget.month.received);
    expect(check()).toBeTruthy();
    await showReal();
    expect(check()).toBeTruthy();
  });

  it('has no check while the income is short', async () => {
    await renderPart(MonthCard, inputs(2800000, { receivedIncome: 100 }));
    expect(check()).toBeNull();
  });

  it('has no check without an expected income', async () => {
    await renderPart(MonthCard, inputs(null));
    expect(check()).toBeNull();
  });
});
