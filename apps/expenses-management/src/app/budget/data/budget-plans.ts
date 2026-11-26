import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { quietReads } from '../../ledger/quiet-reads';
import { BudgetApi } from './budget-api';

@Injectable({ providedIn: 'root' })
export class BudgetPlans {
  private readonly api = inject(BudgetApi);
  private readonly known = signal<Readonly<Record<string, boolean>>>({});
  private readonly pending = new Set<string>();
  private bookId: string | null = null;
  private generation = 0;

  readonly plans = this.known.asReadonly();

  load(bookId: string, months: readonly string[]): void {
    if (bookId !== this.bookId) this.forget(bookId);
    const started = this.generation;
    for (const month of months) {
      if (month in this.known() || this.pending.has(month)) continue;
      this.pending.add(month);
      firstValueFrom(this.api.get(bookId, month, quietReads())).then(
        (budget) => {
          if (started !== this.generation) return;
          this.pending.delete(month);
          this.set(bookId, month, budget.hasPlan);
        },
        () => {
          if (started === this.generation) this.pending.delete(month);
        },
      );
    }
  }

  set(bookId: string, month: string, hasPlan: boolean): void {
    if (bookId !== this.bookId) return;
    this.known.update((plans) => ({ ...plans, [month]: hasPlan }));
  }

  private forget(bookId: string | null): void {
    this.bookId = bookId;
    this.generation += 1;
    this.pending.clear();
    this.known.set({});
  }
}
