import { signal } from '@angular/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiMonthStrip, UiMonthStripItem } from './month-strip';

const months: readonly UiMonthStripItem[] = [
  { month: '2026-10', label: 'oct.', caption: '26', status: 'closed', statusLabel: 'Clos' },
  { month: '2026-11', label: 'nov.', caption: '26', status: 'current', statusLabel: 'En cours' },
  { month: '2026-12', label: 'déc.', caption: '26', status: 'planned', statusLabel: 'Prévu' },
  { month: '2027-01', label: 'janv.', caption: '27', status: 'todo', statusLabel: 'À faire' },
  { month: '2027-02', label: 'févr.', caption: '27' },
];

async function setup(selected = '2026-11') {
  const month = signal(selected);
  await render('<ui-month-strip [months]="months" [(selected)]="month" ariaLabel="Mois du budget" />', {
    imports: [UiMonthStrip],
    componentProperties: { months, month },
  });
  const strip = screen.getByRole('navigation', { name: 'Mois du budget' });
  return { month, buttons: () => within(strip).getAllByRole('button') };
}

describe('ui-month-strip', () => {
  afterEach(() => document.documentElement.removeAttribute('dir'));

  it('marks the selected month and shows each status as text', async () => {
    const { buttons } = await setup();
    expect(buttons()[1].getAttribute('aria-current')).toBe('date');
    expect(buttons()[0].getAttribute('aria-current')).toBeNull();
    expect(buttons().map((button) => button.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'oct. 26 Clos',
      'nov. 26 En cours',
      'déc. 26 Prévu',
      'janv. 27 À faire',
      'févr. 27',
    ]);
    expect(buttons()[3].classList).toContain('ui-month-strip__month--todo');
  });

  it('keeps one tab stop on the selected month', async () => {
    const { buttons } = await setup();
    expect(buttons().map((button) => button.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1', '-1']);
  });

  it('moves focus with the arrows and selects with Enter', async () => {
    const { buttons, month } = await setup();
    buttons()[1].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(buttons()[2]);
    expect(month()).toBe('2026-11');
    await userEvent.keyboard('{Enter}');
    expect(month()).toBe('2026-12');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(buttons()[4]);
  });

  it('mirrors the arrows in RTL', async () => {
    document.documentElement.dir = 'rtl';
    const { buttons } = await setup();
    buttons()[1].focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(buttons()[2]);
  });

  it('selects a month on click', async () => {
    const { buttons, month } = await setup();
    await userEvent.click(buttons()[0]);
    expect(month()).toBe('2026-10');
  });
});
