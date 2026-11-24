import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/http-data-access';
import { Observable, of, throwError } from 'rxjs';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';
import { InvitationsApi } from './invitations-api';
import { InvitationsStore } from './invitations.store';
import { Household, ReceivedInvitation } from './models';
import { DONE } from './store-result';

function card(id: string): ReceivedInvitation {
  return { id, household: { id: 'h1', name: 'Foyer' }, invitedBy: { name: 'Sofiane' }, createdAt: new Date(0), expiresAt: new Date(1) };
}

function failure(code: string, status: number): Observable<never> {
  return throwError(() => new ApiError(status === 404 ? 'not-found' : 'validation', status, code, {}, null, 'r1'));
}

describe('InvitationsStore', () => {
  const api = {
    received: vi.fn<() => Observable<ReceivedInvitation[]>>(),
    accept: vi.fn<(id: string) => Observable<Household>>(),
    decline: vi.fn<(id: string) => Observable<void>>(),
  };
  const current = signal<Household | null>(null);
  const household = { household: current, applyAccepted: vi.fn(), loadHousehold: vi.fn(() => Promise.resolve(DONE)) };
  const books = { load: vi.fn(() => Promise.resolve(DONE)) };

  function store(): InstanceType<typeof InvitationsStore> {
    return TestBed.inject(InvitationsStore);
  }

  async function loaded(): Promise<InstanceType<typeof InvitationsStore>> {
    api.received.mockReturnValue(of([card('i1'), card('i2')]));
    await store().load();
    return store();
  }

  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    household.applyAccepted.mockClear();
    household.loadHousehold.mockClear();
    books.load.mockClear();
    current.set(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: InvitationsApi, useValue: api },
        { provide: HouseholdStore, useValue: household },
        { provide: BooksStore, useValue: books },
      ],
    });
  });

  describe('load', () => {
    it('loads the cards when the user has no household', async () => {
      const s = await loaded();
      expect(s.received().map((c) => c.id)).toEqual(['i1', 'i2']);
      expect(s.loading()).toBe(false);
    });

    it('shows none and sends no request when the user has a household', async () => {
      current.set({ id: 'h1', name: 'Foyer', role: 'member' });
      expect(await store().load()).toEqual(DONE);
      expect(api.received).not.toHaveBeenCalled();
      expect(store().received()).toEqual([]);
    });

    it('returns the error and stops loading', async () => {
      api.received.mockReturnValue(failure('http.500', 500));
      expect((await store().load()).outcome).toBe('error');
      expect(store().loading()).toBe(false);
    });
  });

  describe('accept', () => {
    it('stores the household, clears the cards and refreshes the books', async () => {
      const s = await loaded();
      const accepted: Household = { id: 'h1', name: 'Foyer', role: 'member' };
      api.accept.mockReturnValue(of(accepted));
      expect(await s.accept('i1')).toEqual(DONE);
      expect(household.applyAccepted).toHaveBeenCalledWith(accepted);
      expect(books.load).toHaveBeenCalledWith({ force: true });
      expect(s.received()).toEqual([]);
    });

    it('removes the card on invitation.not_found', async () => {
      const s = await loaded();
      api.accept.mockReturnValue(failure('invitation.not_found', 404));
      const result = await s.accept('i1');
      expect(result.outcome === 'error' && result.error.code).toBe('invitation.not_found');
      expect(s.received().map((c) => c.id)).toEqual(['i2']);
    });

    it('reloads the household and removes every card on household.already_joined', async () => {
      const s = await loaded();
      api.accept.mockReturnValue(failure('household.already_joined', 422));
      const result = await s.accept('i1');
      expect(result.outcome === 'error' && result.error.code).toBe('household.already_joined');
      expect(household.loadHousehold).toHaveBeenCalledTimes(1);
      expect(s.received()).toEqual([]);
    });

    it('keeps the card on household.member_limit', async () => {
      const s = await loaded();
      api.accept.mockReturnValue(failure('household.member_limit', 422));
      const result = await s.accept('i1');
      expect(result.outcome === 'error' && result.error.code).toBe('household.member_limit');
      expect(s.received()).toHaveLength(2);
      expect(books.load).not.toHaveBeenCalled();
    });
  });

  describe('decline', () => {
    it('removes the card on success', async () => {
      const s = await loaded();
      api.decline.mockReturnValue(of(undefined));
      expect(await s.decline('i1')).toEqual(DONE);
      expect(s.received().map((c) => c.id)).toEqual(['i2']);
    });

    it('removes the card on invitation.not_found and returns the error', async () => {
      const s = await loaded();
      api.decline.mockReturnValue(failure('invitation.not_found', 404));
      expect((await s.decline('i1')).outcome).toBe('error');
      expect(s.received().map((c) => c.id)).toEqual(['i2']);
    });

    it('keeps the card on another error', async () => {
      const s = await loaded();
      api.decline.mockReturnValue(failure('http.500', 500));
      expect((await s.decline('i1')).outcome).toBe('error');
      expect(s.received()).toHaveLength(2);
    });
  });

  it('reset empties the cards', async () => {
    const s = await loaded();
    s.reset();
    expect(s.received()).toEqual([]);
  });
});
