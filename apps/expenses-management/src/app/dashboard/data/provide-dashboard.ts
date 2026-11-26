import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from '../../households/data/books.store';
import { LedgerChanges, affects } from '../../ledger/ledger-changes';
import { DashboardStore } from './dashboard.store';

export function provideDashboard(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const session = inject(SessionStore);
    const books = inject(BooksStore);
    const ledger = inject(LedgerChanges);
    const dashboard = inject(DashboardStore);
    const accountId = computed(() => session.account()?.id ?? null);
    let previousAccount: string | null = null;

    effect(() => {
      const current = accountId();
      untracked(() => {
        if (previousAccount !== null && previousAccount !== current) dashboard.reset();
        previousAccount = current;
      });
    });

    effect(() => {
      const bookId = books.selectedBookId();
      untracked(() => {
        const shown = dashboard.bookId();
        const month = dashboard.month();
        if (shown === null || bookId === shown) return;
        if (bookId !== null && dashboard.active() && month !== null) dashboard.open(bookId, month);
        else dashboard.clear();
      });
    });

    effect(() => {
      const change = ledger.last();
      untracked(() => {
        if (change === null) return;
        if (affects(change, dashboard.bookId(), dashboard.month())) dashboard.refresh(change.kind);
        else if (change.kind === 'ledger' && change.bookId === dashboard.bookId()) dashboard.recheckFirstUse();
      });
    });
  });
}
