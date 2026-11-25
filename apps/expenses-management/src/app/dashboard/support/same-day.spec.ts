import { comparisonRanges } from './same-day';

describe('comparisonRanges (spec 008 REQ-4.2)', () => {
  it('compares this month up to today with the previous month up to the same day', () => {
    expect(comparisonRanges('2026-11', '2026-11-25')).toEqual({
      current: { from: '2026-11-01', to: '2026-11-25' },
      previous: { from: '2026-10-01', to: '2026-10-25' },
    });
  });

  it('clamps 31 March to the last day of February', () => {
    expect(comparisonRanges('2027-03', '2027-03-31').previous).toEqual({ from: '2027-02-01', to: '2027-02-28' });
    expect(comparisonRanges('2028-03', '2028-03-31').previous).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('keeps 29 February against 29 January', () => {
    expect(comparisonRanges('2028-02', '2028-02-29')).toEqual({
      current: { from: '2028-02-01', to: '2028-02-29' },
      previous: { from: '2028-01-01', to: '2028-01-29' },
    });
  });

  it('crosses the year in January', () => {
    expect(comparisonRanges('2027-01', '2027-01-10').previous).toEqual({ from: '2026-12-01', to: '2026-12-10' });
  });

  it('compares whole months for a past or a future month', () => {
    expect(comparisonRanges('2026-03', '2026-11-25')).toEqual({
      current: { from: '2026-03-01', to: '2026-03-31' },
      previous: { from: '2026-02-01', to: '2026-02-28' },
    });
    expect(comparisonRanges('2027-01', '2026-11-25').previous).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});
