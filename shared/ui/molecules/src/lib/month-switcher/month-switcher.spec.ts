import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiMonthSwitcher } from './month-switcher';

async function setup(start: string, limits = '') {
  const month = signal(start);
  const result = await render(`<ui-month-switcher [(month)]="month" caption="Carnet du foyer" ${limits} />`, {
    imports: [UiMonthSwitcher],
    componentProperties: { month },
  });
  const label = () => result.container.querySelector('.ui-month-switcher__label')?.textContent?.replace(/\s+/g, ' ').trim();
  return { month, label, ...result };
}

describe('ui-month-switcher', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the month name in French with its caption, in a polite live region', async () => {
    const { label, container } = await setup('2026-03');
    expect(label()).toBe('mars 2026 Carnet du foyer');
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it('moves to the previous and next months across the year', async () => {
    const { month, label, fixture } = await setup('2026-01');
    await userEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    fixture.detectChanges();
    expect(month()).toBe('2025-12');
    expect(label()).toContain('décembre 2025');
    await userEvent.click(screen.getByRole('button', { name: 'Mois suivant' }));
    expect(month()).toBe('2026-01');
  });

  it('disables next at max and previous at min', async () => {
    await setup('2026-11', 'min="2026-11" max="2026-11"');
    expect(screen.getByRole('button', { name: 'Mois suivant' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Mois précédent' })).toHaveProperty('disabled', true);
  });

  it('reports an invalid month and shows no label', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { label } = await setup('2026-13');
    expect(label()).toBe('Carnet du foyer');
    expect(report).toHaveBeenCalledWith('ui-month-switcher: "2026-13" is not a YYYY-MM month');
  });
});
