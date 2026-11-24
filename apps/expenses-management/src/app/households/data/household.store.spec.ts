import { TestBed } from '@angular/core/testing';
import { ApiError, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { HttpContext } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';
import { HouseholdsApi } from './households-api';
import { InvitationsApi } from './invitations-api';
import { Household, Invitation, Member } from './models';
import { DONE } from './store-result';

const OWNER: Household = { id: 'h1', name: 'Foyer', role: 'owner' };
const MEMBER: Household = { id: 'h1', name: 'Foyer', role: 'member' };
const MEMBERS: Member[] = [
  { id: 'u1', name: 'Amira', role: 'owner' },
  { id: 'u2', name: 'Sami', role: 'member' },
];
const INVITATION: Invitation = { id: 'i1', email: 'a@b.tn', createdAt: new Date(0), expiresAt: new Date(1) };

function failure(code: string, status = 422): Observable<never> {
  return throwError(() => new ApiError(status === 404 ? 'not-found' : status === 403 ? 'forbidden' : 'validation', status, code, {}, null, 'r1'));
}

function codesOf(context: HttpContext | undefined): string[] {
  return context ? [...context.get(HANDLED_ERROR_CODES)] : [];
}

describe('HouseholdStore', () => {
  const api = {
    list: vi.fn<() => Observable<Household[]>>(),
    create: vi.fn<(name: string, context?: HttpContext) => Observable<Household>>(),
    rename: vi.fn<(id: string, name: string, context?: HttpContext) => Observable<Household>>(),
    remove: vi.fn<(id: string, context?: HttpContext) => Observable<void>>(),
    members: vi.fn<(id: string) => Observable<Member[]>>(),
    removeMember: vi.fn<(id: string, userId: string, context?: HttpContext) => Observable<void>>(),
    leave: vi.fn<(id: string, context?: HttpContext) => Observable<void>>(),
  };
  const invitations = {
    sent: vi.fn<(id: string) => Observable<Invitation[]>>(),
    invite: vi.fn<(id: string, email: string, context?: HttpContext) => Observable<Invitation>>(),
    cancel: vi.fn<(id: string, invitationId: string, context?: HttpContext) => Observable<void>>(),
  };
  const load = vi.fn(() => Promise.resolve(DONE));

  function store(): InstanceType<typeof HouseholdStore> {
    return TestBed.inject(HouseholdStore);
  }

  async function withHousehold(household: Household): Promise<InstanceType<typeof HouseholdStore>> {
    api.list.mockReturnValue(of([household]));
    await store().loadHousehold();
    return store();
  }

  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    Object.values(invitations).forEach((fn) => fn.mockReset());
    load.mockClear();
    api.members.mockReturnValue(of(MEMBERS));
    invitations.sent.mockReturnValue(of([INVITATION]));
    TestBed.configureTestingModule({
      providers: [
        { provide: HouseholdsApi, useValue: api },
        { provide: InvitationsApi, useValue: invitations },
        { provide: BooksStore, useValue: { load } },
      ],
    });
  });

  describe('loadHousehold', () => {
    it('stores the first household, or null when there is none', async () => {
      const s = await withHousehold(OWNER);
      expect(s.household()).toEqual(OWNER);
      expect(s.isOwner()).toBe(true);
      expect(s.isMember()).toBe(false);
      api.list.mockReturnValue(of([]));
      await s.loadHousehold();
      expect(s.household()).toBeNull();
    });

    it('returns the error and keeps the store usable', async () => {
      api.list.mockReturnValue(failure('http.500', 500));
      const result = await store().loadHousehold();
      expect(result.outcome).toBe('error');
      api.list.mockReturnValue(of([MEMBER]));
      await store().loadHousehold();
      expect(store().isMember()).toBe(true);
    });
  });

  describe('loadDetail', () => {
    it('does nothing without a household', async () => {
      expect(await store().loadDetail()).toEqual(DONE);
      expect(api.members).not.toHaveBeenCalled();
    });

    it('loads members and sent invitations for the owner', async () => {
      const s = await withHousehold(OWNER);
      await s.loadDetail();
      expect(s.members()).toEqual(MEMBERS);
      expect(s.sent()).toEqual([INVITATION]);
      expect(s.loading()).toBe(false);
    });

    it('skips sent invitations for a member', async () => {
      const s = await withHousehold(MEMBER);
      await s.loadDetail();
      expect(invitations.sent).not.toHaveBeenCalled();
      expect(s.members()).toEqual(MEMBERS);
    });

    it('returns the error and stops loading', async () => {
      const s = await withHousehold(OWNER);
      api.members.mockReturnValue(failure('household.not_found', 404));
      const result = await s.loadDetail();
      expect(result.outcome === 'error' && result.error.code).toBe('household.not_found');
      expect(s.loading()).toBe(false);
    });
  });

  describe('create', () => {
    it('stores the new household and declares its handled codes', async () => {
      api.create.mockReturnValue(of(OWNER));
      expect(await store().create('Foyer')).toEqual(DONE);
      expect(store().household()).toEqual(OWNER);
      expect(codesOf(api.create.mock.calls[0][1])).toEqual(['household.limit_reached', 'request.throttled']);
    });

    it.each(['household.limit_reached', 'request.throttled'])('returns %s without storing', async (code) => {
      api.create.mockReturnValue(failure(code, code === 'request.throttled' ? 429 : 422));
      const result = await store().create('Foyer');
      expect(result.outcome === 'error' && result.error.code).toBe(code);
      expect(store().household()).toBeNull();
    });
  });

  describe('rename', () => {
    it('updates the name', async () => {
      const s = await withHousehold(OWNER);
      api.rename.mockReturnValue(of({ ...OWNER, name: 'Famille' }));
      expect(await s.rename('Famille')).toEqual(DONE);
      expect(s.household()?.name).toBe('Famille');
    });

    it('reloads the household on household.forbidden (the role changed)', async () => {
      const s = await withHousehold(OWNER);
      api.rename.mockReturnValue(failure('household.forbidden', 403));
      api.list.mockReturnValue(of([MEMBER]));
      const result = await s.rename('X');
      expect(result.outcome === 'error' && result.error.code).toBe('household.forbidden');
      expect(s.isMember()).toBe(true);
    });

    it('returns household.not_found without side effects', async () => {
      const s = await withHousehold(OWNER);
      api.rename.mockReturnValue(failure('household.not_found', 404));
      expect((await s.rename('X')).outcome).toBe('error');
      expect(s.household()).toEqual(OWNER);
    });
  });

  describe('deleteHousehold', () => {
    it('clears the household and refreshes the books', async () => {
      const s = await withHousehold(OWNER);
      api.remove.mockReturnValue(of(undefined));
      expect(await s.deleteHousehold()).toEqual(DONE);
      expect(s.household()).toBeNull();
      expect(load).toHaveBeenCalledWith({ force: true });
    });

    it('treats household.not_found as done', async () => {
      const s = await withHousehold(OWNER);
      api.remove.mockReturnValue(failure('household.not_found', 404));
      expect(await s.deleteHousehold()).toEqual(DONE);
      expect(s.household()).toBeNull();
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('keeps everything on household.forbidden', async () => {
      const s = await withHousehold(OWNER);
      api.remove.mockReturnValue(failure('household.forbidden', 403));
      expect((await s.deleteHousehold()).outcome).toBe('error');
      expect(s.household()).toEqual(OWNER);
      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('removes the row on success', async () => {
      const s = await withHousehold(OWNER);
      await s.loadDetail();
      api.removeMember.mockReturnValue(of(undefined));
      expect(await s.removeMember('u2')).toEqual(DONE);
      expect(s.members().map((m) => m.id)).toEqual(['u1']);
    });

    it('reloads the list on member.not_found without an error', async () => {
      const s = await withHousehold(OWNER);
      await s.loadDetail();
      api.removeMember.mockReturnValue(failure('member.not_found', 404));
      api.members.mockReturnValue(of([MEMBERS[0]]));
      expect(await s.removeMember('u2')).toEqual(DONE);
      expect(s.members()).toEqual([MEMBERS[0]]);
    });

    it('returns household.not_found for the page to handle', async () => {
      const s = await withHousehold(OWNER);
      api.removeMember.mockReturnValue(failure('household.not_found', 404));
      const result = await s.removeMember('u2');
      expect(result.outcome === 'error' && result.error.code).toBe('household.not_found');
    });
  });

  describe('leave', () => {
    it('clears the household and refreshes the books', async () => {
      const s = await withHousehold(MEMBER);
      api.leave.mockReturnValue(of(undefined));
      expect(await s.leave()).toEqual(DONE);
      expect(s.household()).toBeNull();
      expect(load).toHaveBeenCalledWith({ force: true });
    });

    it('treats household.not_found as done', async () => {
      const s = await withHousehold(MEMBER);
      api.leave.mockReturnValue(failure('household.not_found', 404));
      expect(await s.leave()).toEqual(DONE);
      expect(s.household()).toBeNull();
    });

    it('reloads the household on owner_cannot_leave and returns the error', async () => {
      const s = await withHousehold(MEMBER);
      api.leave.mockReturnValue(failure('household.owner_cannot_leave'));
      api.list.mockReturnValue(of([OWNER]));
      const result = await s.leave();
      expect(result.outcome === 'error' && result.error.code).toBe('household.owner_cannot_leave');
      expect(s.isOwner()).toBe(true);
      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('invite', () => {
    it('adds the invitation to the sent list', async () => {
      const s = await withHousehold(OWNER);
      invitations.invite.mockReturnValue(of(INVITATION));
      expect(await s.invite('a@b.tn')).toEqual(DONE);
      expect(s.sent()).toEqual([INVITATION]);
    });

    it.each([
      'invitation.self',
      'invitation.already_member',
      'invitation.already_pending',
      'invitation.limit_reached',
      'household.member_limit',
    ])('returns %s and leaves the list unchanged', async (code) => {
      const s = await withHousehold(OWNER);
      invitations.invite.mockReturnValue(failure(code));
      const result = await s.invite('a@b.tn');
      expect(result.outcome === 'error' && result.error.code).toBe(code);
      expect(s.sent()).toEqual([]);
      expect(codesOf(invitations.invite.mock.calls[0][2])).toContain(code);
    });

    it('returns request.throttled with the retry delay', async () => {
      const s = await withHousehold(OWNER);
      invitations.invite.mockReturnValue(throwError(() => new ApiError('throttled', 429, 'request.throttled', {}, 7200, 'r1')));
      const result = await s.invite('a@b.tn');
      expect(result.outcome === 'error' && result.error.retryAfterSeconds).toBe(7200);
    });
  });

  describe('cancelInvitation', () => {
    it('removes the row on success and on invitation.not_found', async () => {
      const s = await withHousehold(OWNER);
      await s.loadDetail();
      invitations.cancel.mockReturnValue(of(undefined));
      expect(await s.cancelInvitation('i1')).toEqual(DONE);
      expect(s.sent()).toEqual([]);
      await s.loadDetail();
      invitations.cancel.mockReturnValue(failure('invitation.not_found', 404));
      expect(await s.cancelInvitation('i1')).toEqual(DONE);
      expect(s.sent()).toEqual([]);
    });

    it('keeps the row on household.not_found and returns the error', async () => {
      const s = await withHousehold(OWNER);
      await s.loadDetail();
      invitations.cancel.mockReturnValue(failure('household.not_found', 404));
      expect((await s.cancelInvitation('i1')).outcome).toBe('error');
      expect(s.sent()).toHaveLength(1);
    });
  });

  it('applyAccepted stores the household and reset empties everything', async () => {
    const s = store();
    s.applyAccepted(MEMBER);
    expect(s.isMember()).toBe(true);
    s.reset();
    expect(s.household()).toBeNull();
    expect(s.members()).toEqual([]);
    expect(s.sent()).toEqual([]);
  });
});
