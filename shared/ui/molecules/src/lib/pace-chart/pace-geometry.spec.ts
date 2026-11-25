import { CHART_WIDTH, PLOT_BOTTOM, chartMax, linePath, overPath, paceState, referencePath, straightPath, tickDays, valueAt, xOf, yOf } from './pace-geometry';

const points = [
  { day: 1, value: 100 },
  { day: 2, value: 300 },
  { day: 3, value: 700 },
  { day: 4, value: 900 },
];

describe('pace geometry (spec 008 REQ-9.1, 9.2)', () => {
  it('maps days to x across the plot and values to y from the baseline', () => {
    expect(xOf(0, 30)).toBe(8);
    expect(xOf(30, 30)).toBe(CHART_WIDTH - 8);
    expect(xOf(99, 30)).toBe(CHART_WIDTH - 8);
    expect(yOf(0, 500)).toBe(PLOT_BOTTOM);
    expect(yOf(500, 500)).toBeLessThan(yOf(250, 500));
  });

  it('takes the largest of the line, the target and the reference as the scale', () => {
    expect(chartMax(points, 600, undefined)).toBe(900);
    expect(chartMax(points, 2000, [50])).toBe(2000);
    expect(chartMax(points, undefined, [1500])).toBe(1500);
  });

  it('keeps a flat line on a scale of 1 for an all-zero month', () => {
    const zeros = [
      { day: 1, value: 0 },
      { day: 2, value: 0 },
    ];
    const max = chartMax(zeros, undefined, undefined);
    expect(max).toBe(1);
    expect(linePath(zeros, 30, max)).toMatch(new RegExp(`^M8 ${PLOT_BOTTOM}( L[\\d.]+ ${PLOT_BOTTOM}){2}$`));
  });

  it('starts at the origin and stops at today', () => {
    expect(linePath(points, 30, 900, 2).split('L')).toHaveLength(3);
    expect(linePath(points, 30, 900).split('L')).toHaveLength(5);
    expect(linePath([], 30, 900)).toBe('');
  });

  it('draws the straight target line from zero to the target at the last day', () => {
    const path = straightPath(600, 30, 900);
    expect(path.startsWith(`M8 ${PLOT_BOTTOM}`)).toBe(true);
    expect(path).toContain(`L${CHART_WIDTH - 8} `);
  });

  it('draws the reference from day 1 and drops days after the month end', () => {
    expect(referencePath([], 30, 900)).toBe('');
    expect(referencePath([1, 2, 3, 4], 3, 900).split('L')).toHaveLength(4);
  });

  it('classifies ok, warning and over against the straight line and the total target', () => {
    expect(paceState(100, 600, 15, 30)).toBe('ok');
    expect(paceState(300, 600, 15, 30)).toBe('ok');
    expect(paceState(400, 600, 15, 30)).toBe('warning');
    expect(paceState(600, 600, 15, 30)).toBe('warning');
    expect(paceState(601, 600, 15, 30)).toBe('over');
    expect(paceState(9999, undefined, 15, 30)).toBe('ok');
    expect(paceState(9999, 0, 15, 30)).toBe('ok');
  });

  it('dashes only the part above the target, joined to the previous point', () => {
    expect(overPath(points, 800, 30, 900)).toBe(overPath(points.slice(2), 800, 30, 900));
    expect(overPath(points, 800, 30, 900).split('L')).toHaveLength(2);
    expect(overPath(points, 1000, 30, 900)).toBe('');
    expect(overPath(points, undefined, 30, 900)).toBe('');
    expect(overPath(points, 800, 30, 900, 3)).toBe('');
  });

  it('reads the value at today or the last point', () => {
    expect(valueAt(points, 2)?.value).toBe(300);
    expect(valueAt(points)?.value).toBe(900);
    expect(valueAt([], 2)).toBeNull();
  });

  it('puts three ticks on a month and one on a degenerate month', () => {
    expect(tickDays(30)).toEqual([1, 15, 30]);
    expect(tickDays(28)).toEqual([1, 14, 28]);
    expect(tickDays(1)).toEqual([1]);
  });
});
