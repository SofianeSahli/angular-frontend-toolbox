import { TestBed } from '@angular/core/testing';
import { LedgerChanges, affects } from './ledger-changes';

describe('LedgerChanges (spec 008 REQ-8.3)', () => {
  let ledger: LedgerChanges;

  beforeEach(() => {
    ledger = TestBed.inject(LedgerChanges);
  });

  it('starts with no change', () => {
    expect(ledger.last()).toBeNull();
  });

  it('records entry changes with distinct months and a growing version', () => {
    ledger.changed('b1', ['2026-11', '2026-11', '2026-10']);
    expect(ledger.last()).toEqual({ kind: 'ledger', bookId: 'b1', months: ['2026-11', '2026-10'], version: 1 });
    ledger.changed('b1', 'all');
    expect(ledger.last()).toEqual({ kind: 'ledger', bookId: 'b1', months: 'all', version: 2 });
  });

  it('records a budget change for one month', () => {
    ledger.budgetChanged('b1', '2026-11');
    expect(ledger.last()).toMatchObject({ kind: 'budget', months: ['2026-11'] });
  });

  it('affects only the same book and a listed month', () => {
    ledger.changed('b1', ['2026-11']);
    const change = ledger.last();
    if (change === null) throw new Error('no change');
    expect(affects(change, 'b1', '2026-11')).toBe(true);
    expect(affects(change, 'b1', '2026-10')).toBe(false);
    expect(affects(change, 'b2', '2026-11')).toBe(false);
    expect(affects({ ...change, months: 'all' }, 'b1', '2026-01')).toBe(true);
    expect(affects(change, null, '2026-11')).toBe(false);
  });
});
