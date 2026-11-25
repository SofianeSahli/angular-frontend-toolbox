import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from '../../households/data/books.store';
import { LedgerChanges, affects } from '../../ledger/ledger-changes';
import { BudgetStore } from './budget.store';

export function provideBudget(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const session = inject(SessionStore);
    const books = inject(BooksStore);
    const ledger = inject(LedgerChanges);
    const budget = inject(BudgetStore);
    const accountId = computed(() => session.account()?.id ?? null);
    let previousAccount: string | null = null;

    effect(() => {
      const current = accountId();
      untracked(() => {
        if (previousAccount !== null && previousAccount !== current) budget.reset();
        previousAccount = current;
      });
    });

    effect(() => {
      const bookId = books.selectedBookId();
      untracked(() => {
        const shown = budget.bookId();
        const month = budget.month();
        if (shown === null || bookId === shown) return;
        if (bookId !== null && budget.active() && month !== null) void budget.open(bookId, month);
        else budget.clear();
      });
    });

    effect(() => {
      const change = ledger.last();
      untracked(() => {
        if (change === null || change.kind !== 'ledger' || budget.status() !== 'ready') return;
        if (affects(change, budget.bookId(), budget.month())) void budget.reload({ quiet: true });
      });
    });
  });
}
