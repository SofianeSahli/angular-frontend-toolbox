import { Component, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError, ApiErrorKind } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiConfirm, UiToast } from '@shared/ui-organisms';
import { render } from '@testing-library/angular';
import fr from '../../../public/i18n/fr.json';
import { BooksStatus, BooksStore } from './data/books.store';
import { HouseholdStore } from './data/household.store';
import { InvitationsStore } from './data/invitations.store';
import { Book, Household, Invitation, Member, ReceivedInvitation } from './data/models';
import { DONE, StoreResult } from './data/store-result';

@Component({ template: '' })
class Destination {}

export { DONE };

export function failed(code: string, status = 422, kind: ApiErrorKind = 'conflict', retryAfterSeconds: number | null = null): StoreResult {
  return { outcome: 'error', error: new ApiError(kind, status, code, {}, retryAfterSeconds, 'req-1') };
}

export function book(id: string, owner: 'account' | 'household' = 'account'): Book {
  return {
    id,
    name: `Carnet ${id}`,
    currency: { code: 'TND', exponent: 3 },
    timezone: 'Africa/Tunis',
    owner: { type: owner, id: 'x' },
    canManage: true,
  };
}

export function invitation(id: string, householdName = 'Les Martin'): ReceivedInvitation {
  return {
    id,
    household: { id: 'h1', name: householdName },
    invitedBy: { name: 'Sami' },
    createdAt: new Date(2026, 10, 1),
    expiresAt: new Date(2026, 10, 15),
  };
}

export function member(id: string, role: 'owner' | 'member' = 'member'): Member {
  return { id, name: `Personne ${id}`, role };
}

export function sentInvitation(id: string, email = `${id}@exemple.tn`): Invitation {
  return { id, email, createdAt: new Date(2026, 10, 1), expiresAt: new Date(2026, 10, 15) };
}

export function fakeStores() {
  const books = signal<readonly Book[]>([]);
  const selectedBookId = signal<string | null>(null);
  const status = signal<BooksStatus>('ready');
  const household = signal<Household | null>(null);
  const received = signal<readonly ReceivedInvitation[]>([]);
  const invitationsLoading = signal(false);
  const members = signal<readonly Member[]>([]);
  const sent = signal<readonly Invitation[]>([]);
  const detailLoading = signal(false);
  const result = () => vi.fn<() => Promise<StoreResult>>().mockResolvedValue(DONE);
  return {
    books: {
      books,
      status,
      selectedBookId,
      selectedBook: () => books().find((b) => b.id === selectedBookId()) ?? null,
      householdBook: () => books().find((b) => b.owner.type === 'household') ?? null,
      personalBooks: () => books().filter((b) => b.owner.type === 'account'),
      canCreatePersonalBook: () => books().filter((b) => b.owner.type === 'account').length < 5,
      load: vi.fn<() => Promise<StoreResult>>().mockResolvedValue(DONE),
      select: vi.fn<(id: string) => void>(),
      create: vi.fn<(input: unknown) => Promise<StoreResult>>().mockResolvedValue(DONE),
    },
    household: {
      household,
      isOwner: () => household()?.role === 'owner',
      isMember: () => household()?.role === 'member',
      members,
      sent,
      loading: detailLoading,
      create: vi.fn<(name: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
      loadHousehold: result(),
      loadDetail: result(),
      rename: vi.fn<(name: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
      deleteHousehold: result(),
      removeMember: vi.fn<(id: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
      leave: result(),
      invite: vi.fn<(email: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
      cancelInvitation: vi.fn<(id: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
    },
    invitations: {
      received,
      loading: invitationsLoading,
      load: vi.fn<() => Promise<StoreResult>>().mockResolvedValue(DONE),
      accept: vi.fn<(id: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
      decline: vi.fn<(id: string) => Promise<StoreResult>>().mockResolvedValue(DONE),
    },
    session: { account: signal({ id: 'u1', name: 'Moi' }) },
    confirm: { ask: vi.fn<(options: unknown) => Promise<boolean>>().mockResolvedValue(true) },
  };
}

export type FakeStores = ReturnType<typeof fakeStores>;

export async function renderPage<T>(page: Type<T>, stores: FakeStores, url = '/page') {
  const path = url.split('?')[0].slice(1);
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([
        { path, component: page },
        { path: '', component: Destination },
        { path: '**', component: Destination },
      ]),
      provideTranslateService({ lang: 'fr' }),
      { provide: BooksStore, useValue: stores.books },
      { provide: HouseholdStore, useValue: stores.household },
      { provide: InvitationsStore, useValue: stores.invitations },
      { provide: SessionStore, useValue: stores.session },
      { provide: UiConfirm, useValue: stores.confirm },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  view.detectChanges();
  last = view;
  await settle(view);
  return { ...view, router, toasts: () => TestBed.inject(UiToast).toasts() };
}

let last: { detectChanges(): void } | null = null;

export async function settle(view: { detectChanges(): void } | null = last): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  view?.detectChanges();
}
