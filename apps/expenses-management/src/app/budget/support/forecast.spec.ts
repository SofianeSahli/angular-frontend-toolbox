import { budget, lineDto } from '../testing';
import { forecast, realised } from './forecast';

const lines = budget().lines.map(({ category, planned }) => ({ category, planned }));

describe('forecast (spec 009 follow-up)', () => {
  it.each([
    [2800000, 100000],
    [2700000, 0],
    [2550000, -150000],
  ])('takes expense lines and saving from an income of %d', (income, remainder) => {
    expect(forecast(income, 2500000, 200000)).toEqual({ income, lines: 2500000, saving: 200000, spending: 2700000, remainder });
  });

  it('has no remainder without an expected income, and treats no saving as zero', () => {
    expect(forecast(null, 2500000, null)).toEqual({ income: null, lines: 2500000, saving: 0, spending: 2500000, remainder: null });
  });
});

describe('realised (backend contract 008)', () => {
  it('gives the backend off-plan and remaining for the saved plan, with saving in the actual', () => {
    expect(realised(budget(), lines, null)).toEqual({ actual: 1312500, offPlan: 12500, left: 47500 });
  });

  it('adds the saving still to put aside, never below zero', () => {
    expect(realised(budget(), lines, 300000).left).toBe(247500);
    expect(realised(budget(), lines, 50000).left).toBe(47500);
  });

  it('does not let an over-plan line offset another one', () => {
    const answer = budget({
      expenses: { planned: 200, actual: 900, off_plan: 0, remaining: 100 },
      lines: [lineDto('a', { planned: 100, actual: 900 }), lineDto('b', { planned: 100, actual: 0 })],
    });
    expect(realised(answer, answer.lines, null).left).toBe(100);
  });

  it('counts the spending of a removed line as off plan', () => {
    expect(realised(budget(), lines.slice(1), null).offPlan).toBe(552500);
  });
});
