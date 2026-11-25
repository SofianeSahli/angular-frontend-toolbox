import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from '../../households/data/books.store';
import { RecurringStore } from './recurring.store';

export function provideRecurring(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const session = inject(SessionStore);
    const books = inject(BooksStore);
    const recurring = inject(RecurringStore);
    const accountId = computed(() => session.account()?.id ?? null);
    let previousAccount: string | null = null;

    effect(() => {
      const current = accountId();
      untracked(() => {
        if (previousAccount !== null && previousAccount !== current) recurring.reset();
        previousAccount = current;
      });
    });

    effect(() => {
      const bookId = books.selectedBookId();
      untracked(() => {
        const shown = recurring.bookId();
        if (shown === null || bookId === shown) return;
        if (bookId !== null && recurring.active()) void recurring.open(bookId);
        else recurring.clear();
      });
    });
  });
}
