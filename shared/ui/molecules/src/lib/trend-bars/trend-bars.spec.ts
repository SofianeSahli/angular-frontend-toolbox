import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiTrendBars, UiTrendItem } from './trend-bars';

const items: UiTrendItem[] = [
  { id: '2026-09', label: 'sept.', value: 400, valueText: '400 DT' },
  { id: '2026-10', label: 'oct.', value: 0, valueText: '0 DT' },
  { id: '2026-11', label: 'nov.', value: 800, valueText: '800 DT', current: true },
];

function fills(): number[] {
  return [...document.querySelectorAll('.ui-trend-bars__fill')].map((rect) => Number(rect.getAttribute('height')));
}

describe('ui-trend-bars (spec 008 REQ-9.3, 9.4)', () => {
  it('is a named group (its bars are buttons) with a hidden table of the values', async () => {
    await render(UiTrendBars, { inputs: { items, label: '6 derniers mois' } });
    expect(screen.getByRole('group', { name: '6 derniers mois' })).not.toBeNull();
    expect([...document.querySelectorAll('tbody tr')].map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['sept. 400 DT', 'oct. 0 DT', 'nov. 800 DT']);
  });

  it('scales bars to the largest value and draws none for zero', async () => {
    await render(UiTrendBars, { inputs: { items, label: 'l' } });
    const [first, last] = fills();
    expect(fills()).toHaveLength(2);
    expect(last).toBeGreaterThan(first);
    expect(first).toBeCloseTo(last / 2, 5);
  });

  it('writes the value on every bar, including a zero one', async () => {
    await render(UiTrendBars, { inputs: { items, label: 'l' } });
    expect([...document.querySelectorAll('.ui-trend-bars__value')].map((text) => text.textContent)).toEqual(['400 DT', '0 DT', '800 DT']);
  });

  it('highlights only the current item', async () => {
    await render(UiTrendBars, { inputs: { items, label: 'l' } });
    const current = document.querySelectorAll('.ui-trend-bars__bar--current');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('aria-current')).toBe('true');
  });

  it('keeps the given order and gives each bar a name and a button role', async () => {
    await render(UiTrendBars, { inputs: { items, label: 'l' } });
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(['sept., 400 DT', 'oct., 0 DT', 'nov., 800 DT']);
    expect(buttons.every((button) => button.getAttribute('tabindex') === '0')).toBe(true);
  });

  it('emits the id on click, Enter and Space', async () => {
    const itemSelect = vi.fn();
    await render(UiTrendBars, { inputs: { items, label: 'l' }, on: { itemSelect } });
    const [first, , last] = screen.getAllByRole('button');
    await userEvent.click(first);
    last.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(itemSelect.mock.calls.map(([id]) => id)).toEqual(['2026-09', '2026-11', '2026-11']);
  });

  it('shows the average under the chart only when given', async () => {
    const { rerender } = await render(UiTrendBars, { inputs: { items, label: 'l', averageText: 'Moyenne : 600 DT' } });
    expect(screen.getByText('Moyenne : 600 DT')).not.toBeNull();
    await rerender({ inputs: { items, label: 'l', averageText: undefined } });
    expect(document.querySelector('.ui-trend-bars__average')).toBeNull();
  });

  it('draws no bar for an empty series', async () => {
    await render(UiTrendBars, { inputs: { items: [], label: 'l' } });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
