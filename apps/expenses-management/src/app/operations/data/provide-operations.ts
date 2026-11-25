import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from '../../households/data/books.store';
import { OperationsStore } from './operations.store';

export function provideOperations(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const session = inject(SessionStore);
    const books = inject(BooksStore);
    const operations = inject(OperationsStore);
    const accountId = computed(() => session.account()?.id ?? null);
    let previousAccount: string | null = null;

    effect(() => {
      const current = accountId();
      untracked(() => {
        if (previousAccount !== null && previousAccount !== current) operations.reset();
        previousAccount = current;
      });
    });

    effect(() => {
      const bookId = books.selectedBookId();
      const active = operations.active();
      untracked(() => {
        if (active && bookId !== null && bookId !== operations.bookId()) void operations.open(bookId);
      });
    });
  });
}
