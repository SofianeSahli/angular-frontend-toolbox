import { render, screen } from '@testing-library/angular';
import { UiStat } from './stat';

describe('ui-stat', () => {
  it('is a group named by its label, holding the value and the meta line', async () => {
    await render('<ui-stat label="Reste à dépenser">1 843 DT<span uiStatMeta>sur 2 600 DT</span></ui-stat>', { imports: [UiStat] });
    const stat = screen.getByRole('group', { name: 'Reste à dépenser' });
    expect(stat.querySelector('.ui-stat__value')?.textContent).toBe('1 843 DT');
    expect(stat.querySelector('.ui-stat__meta')?.textContent).toBe('sur 2 600 DT');
  });

  it.each([
    ['size="hero"', 'ui-stat--hero'],
    ['tone="accent"', 'ui-stat--accent'],
    ['tone="income"', 'ui-stat--income'],
  ])('applies %s', async (attribute, cssClass) => {
    await render(`<ui-stat label="Revenus" ${attribute}>2 800 DT</ui-stat>`, { imports: [UiStat] });
    expect(screen.getByRole('group').classList).toContain(cssClass);
  });
});
