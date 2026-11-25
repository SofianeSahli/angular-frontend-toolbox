import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from '../../households/data/books.store';
import { LedgerChanges, affects } from '../../ledger/ledger-changes';
import { addMonths } from '../../ledger/month-context';
import { DashboardStore } from './dashboard.store';

function touchesHistory(months: readonly string[] | 'all', shown: string | null): boolean {
  if (shown === null || months === 'all') return false;
  return months.some((month) => month < shown && month >= addMonths(shown, -5));
}

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
        else if (change.kind === 'ledger' && change.bookId === dashboard.bookId()) {
          dashboard.recheckFirstUse();
          if (touchesHistory(change.months, dashboard.month())) dashboard.refresh('history');
        }
      });
    });
  });
}
