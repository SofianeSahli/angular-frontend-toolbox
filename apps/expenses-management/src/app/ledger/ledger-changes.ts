import { Injectable, signal } from '@angular/core';

export type LedgerChangeKind = 'ledger' | 'budget';

export interface LedgerChange {
  readonly kind: LedgerChangeKind;
  readonly bookId: string;
  readonly months: readonly string[] | 'all';
  readonly version: number;
}

export function affects(change: LedgerChange, bookId: string | null, month: string | null): boolean {
  if (bookId === null || change.bookId !== bookId) return false;
  return change.months === 'all' || (month !== null && change.months.includes(month));
}

@Injectable({ providedIn: 'root' })
export class LedgerChanges {
  private version = 0;
  private readonly current = signal<LedgerChange | null>(null);

  readonly last = this.current.asReadonly();

  changed(bookId: string, months: readonly string[] | 'all'): void {
    this.emit('ledger', bookId, months === 'all' ? months : [...new Set(months)]);
  }

  budgetChanged(bookId: string, month: string): void {
    this.emit('budget', bookId, [month]);
  }

  private emit(kind: LedgerChangeKind, bookId: string, months: readonly string[] | 'all'): void {
    this.version += 1;
    this.current.set({ kind, bookId, months, version: this.version });
  }
}
