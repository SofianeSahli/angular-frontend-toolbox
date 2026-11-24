import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionStore } from '@shared/identity-data-access';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';
import { InvitationsStore } from './invitations.store';
import { provideHouseholds } from './provide-households';

interface Account {
  readonly id: string;
  readonly name: string;
}

describe('provideHouseholds', () => {
  const account = signal<Account | null>(null);
  const resets = { books: vi.fn(), household: vi.fn(), invitations: vi.fn() };

  beforeEach(() => {
    Object.values(resets).forEach((fn) => fn.mockClear());
    account.set(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStore, useValue: { account } },
        { provide: BooksStore, useValue: { reset: resets.books } },
        { provide: HouseholdStore, useValue: { reset: resets.household } },
        { provide: InvitationsStore, useValue: { reset: resets.invitations } },
        provideHouseholds(),
      ],
    });
    TestBed.inject(SessionStore);
    TestBed.tick();
  });

  function expectResets(times: number): void {
    expect(resets.books).toHaveBeenCalledTimes(times);
    expect(resets.household).toHaveBeenCalledTimes(times);
    expect(resets.invitations).toHaveBeenCalledTimes(times);
  }

  it('does not reset on start or on sign-in', () => {
    expectResets(0);
    account.set({ id: 'a1', name: 'Amira' });
    TestBed.tick();
    expectResets(0);
  });

  it('does not reset when the same account is refreshed', () => {
    account.set({ id: 'a1', name: 'Amira' });
    TestBed.tick();
    account.set({ id: 'a1', name: 'Amira S.' });
    TestBed.tick();
    expectResets(0);
  });

  it('resets all three stores when the account changes', () => {
    account.set({ id: 'a1', name: 'Amira' });
    TestBed.tick();
    account.set({ id: 'a2', name: 'Sami' });
    TestBed.tick();
    expectResets(1);
  });

  it('resets all three stores when the session ends', () => {
    account.set({ id: 'a1', name: 'Amira' });
    TestBed.tick();
    account.set(null);
    TestBed.tick();
    expectResets(1);
  });
});
