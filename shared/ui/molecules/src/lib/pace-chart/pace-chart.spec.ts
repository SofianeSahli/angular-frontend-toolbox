import { render, screen } from '@testing-library/angular';
import { UiPaceChart } from './pace-chart';

const days = [
  { day: 1, value: 100 },
  { day: 2, value: 300 },
  { day: 3, value: 700 },
];

function part(name: string): Element | null {
  return document.querySelector(`.ui-pace-chart__${name}`);
}

describe('ui-pace-chart (spec 008 REQ-9.1, 9.2, 9.4)', () => {
  it('is an image named by the summary text, with a hidden table of the values', async () => {
    await render(UiPaceChart, { inputs: { days, daysInMonth: 30, label: 'Rythme du mois', summaryText: '700 DT dépensés sur 3 jours' } });
    expect(screen.getByRole('img', { name: '700 DT dépensés sur 3 jours' })).not.toBeNull();
    expect(document.querySelector('caption')?.textContent).toBe('Rythme du mois');
    expect([...document.querySelectorAll<HTMLTableRowElement>('tbody tr')].map((row) => [...row.cells].map((cell) => cell.textContent?.trim()))).toEqual([
      ['1', '100'],
      ['2', '300'],
      ['3', '700'],
    ]);
  });

  it('draws only the line, with no marker, target or reference by default', async () => {
    await render(UiPaceChart, { inputs: { days, daysInMonth: 30, label: 'l', summaryText: 's' } });
    expect(part('line')?.getAttribute('d')).toBeTruthy();
    expect(part('today')).toBeNull();
    expect(part('target')).toBeNull();
    expect(part('reference')).toBeNull();
    expect(part('over')).toBeNull();
  });

  it('draws the marker and stops the line at today', async () => {
    await render(UiPaceChart, { inputs: { days, daysInMonth: 30, today: 2, label: 'l', summaryText: 's' } });
    expect(part('today')).not.toBeNull();
    expect(part('line')?.getAttribute('d')?.split('L')).toHaveLength(3);
  });

  it('draws the target and the reference as separate dotted paths', async () => {
    await render(UiPaceChart, { inputs: { days, daysInMonth: 30, target: 1500, reference: [50, 120, 400], label: 'l', summaryText: 's' } });
    expect(part('target')?.getAttribute('d')).toBeTruthy();
    expect(part('reference')?.getAttribute('d')).toBeTruthy();
  });

  it('keeps the ok state under the straight target line', async () => {
    const { fixture } = await render(UiPaceChart, { inputs: { days, daysInMonth: 3, today: 3, target: 3000, label: 'l', summaryText: 's' } });
    expect(fixture.nativeElement.classList).not.toContain('ui-pace-chart--warning');
    expect(fixture.nativeElement.classList).not.toContain('ui-pace-chart--over');
  });

  it('turns warning above the straight line but within the target', async () => {
    const { fixture } = await render(UiPaceChart, { inputs: { days, daysInMonth: 30, today: 3, target: 3000, label: 'l', summaryText: 's' } });
    expect(fixture.nativeElement.classList).toContain('ui-pace-chart--warning');
    expect(part('over')).toBeNull();
  });

  it('turns over above the target and dashes the part above it', async () => {
    const { fixture } = await render(UiPaceChart, { inputs: { days, daysInMonth: 30, today: 3, target: 500, label: 'l', summaryText: 's' } });
    expect(fixture.nativeElement.classList).toContain('ui-pace-chart--over');
    expect(part('over')?.getAttribute('d')).toBeTruthy();
  });

  it('draws nothing but the axis for an empty series', async () => {
    await render(UiPaceChart, { inputs: { days: [], daysInMonth: 30, label: 'l', summaryText: 'Aucune dépense' } });
    expect(part('line')).toBeNull();
    expect(part('dot')).toBeNull();
    expect(part('axis')).not.toBeNull();
  });
});
