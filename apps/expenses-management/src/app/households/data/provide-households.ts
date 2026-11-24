import { EnvironmentProviders, computed, effect, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';
import { InvitationsStore } from './invitations.store';

export function provideHouseholds(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const session = inject(SessionStore);
    const books = inject(BooksStore);
    const household = inject(HouseholdStore);
    const invitations = inject(InvitationsStore);
    const accountId = computed(() => session.account()?.id ?? null);
    let previous: string | null = null;
    effect(() => {
      const current = accountId();
      untracked(() => {
        if (previous !== null && previous !== current) {
          books.reset();
          household.reset();
          invitations.reset();
        }
        previous = current;
      });
    });
  });
}
