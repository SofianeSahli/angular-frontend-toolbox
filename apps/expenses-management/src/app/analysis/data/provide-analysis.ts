import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from '../../households/data/books.store';
import { LedgerChanges, affects } from '../../ledger/ledger-changes';
import { addMonths } from '../../ledger/month-context';
import { AnalysisStore } from './analysis.store';

function touchesHistory(months: readonly string[] | 'all', shown: string | null): boolean {
  if (shown === null || months === 'all') return false;
  return months.some((month) => month < shown && month >= addMonths(shown, -5));
}

export function provideAnalysis(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const session = inject(SessionStore);
    const books = inject(BooksStore);
    const ledger = inject(LedgerChanges);
    const analysis = inject(AnalysisStore);
    const accountId = computed(() => session.account()?.id ?? null);
    let previousAccount: string | null = null;

    effect(() => {
      const current = accountId();
      untracked(() => {
        if (previousAccount !== null && previousAccount !== current) analysis.reset();
        previousAccount = current;
      });
    });

    effect(() => {
      const bookId = books.selectedBookId();
      untracked(() => {
        const shown = analysis.bookId();
        const month = analysis.month();
        if (shown === null || bookId === shown) return;
        if (bookId !== null && analysis.active() && month !== null) analysis.open(bookId, month);
        else analysis.clear();
      });
    });

    effect(() => {
      const change = ledger.last();
      untracked(() => {
        if (change === null) return;
        if (affects(change, analysis.bookId(), analysis.month())) analysis.refresh(change.kind);
        else if (change.kind === 'ledger' && change.bookId === analysis.bookId() && touchesHistory(change.months, analysis.month())) analysis.refresh('history');
      });
    });
  });
}
