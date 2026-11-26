import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { BooksStore } from '../data/books.store';
import { HouseholdStore } from '../data/household.store';
import { QrInvitationsApi } from '../data/qr-invitations-api';
import { book, fakeStores } from '../testing';
import { JoinPage } from './join.page';

@Component({ template: '<p>accueil</p>' })
class Home {}

const settle = () => new Promise((resolve) => setTimeout(resolve));
const preview = { household: { id: 'h1', name: 'Les Martin' }, invitedBy: { name: 'Amira' }, expiresAt: new Date() };
const error = (code: string, status = 422) => new ApiError('validation', status, code, {}, 30, 'r');

async function renderJoin(url: string, api: { preview: ReturnType<typeof vi.fn>; accept: ReturnType<typeof vi.fn> }) {
  const stores = fakeStores();
  stores.books.load.mockImplementation(async () => {
    stores.books.books.set([book('hb', 'household')]);
    return { outcome: 'done' };
  });
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([
        { path: 'rejoindre', component: JoinPage },
        { path: '', component: Home },
      ]),
      provideTranslateService({ lang: 'fr' }),
      { provide: QrInvitationsApi, useValue: api },
      { provide: BooksStore, useValue: stores.books },
      { provide: HouseholdStore, useValue: { ...stores.household, applyAccepted: vi.fn() } },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  view.detectChanges();
  await settle();
  view.detectChanges();
  return { view, router, stores };
}

describe('JoinPage (spec 009 REQ-11.4)', () => {
  it('previews the household of the token and joins it', async () => {
    const api = { preview: vi.fn(() => of(preview)), accept: vi.fn(() => of({ id: 'h1', name: 'Les Martin', role: 'member' })) };
    const { router, stores } = await renderJoin('/rejoindre#tok', api);
    expect(api.preview).toHaveBeenCalledWith('tok');
    expect(screen.getByText('Les Martin')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: fr.households.join.accept }));
    await settle();
    expect(api.accept).toHaveBeenCalledWith('tok');
    expect(stores.books.select).toHaveBeenCalledWith('hb');
    expect(router.url).toBe('/');
  });

  it('says the code is no longer valid', async () => {
    const api = { preview: vi.fn(() => throwError(() => error('invitation.not_found', 404))), accept: vi.fn() };
    await renderJoin('/rejoindre#old', api);
    expect(screen.getByText(fr.households.join.errors.notFound)).toBeTruthy();
    expect(screen.queryByRole('button', { name: fr.households.join.accept })).toBeNull();
  });

  it('says the code is not valid without a token', async () => {
    const api = { preview: vi.fn(), accept: vi.fn() };
    await renderJoin('/rejoindre', api);
    expect(api.preview).not.toHaveBeenCalled();
    expect(screen.getByText(fr.households.join.errors.notFound)).toBeTruthy();
  });

  it.each([
    ['household.already_joined', fr.households.join.errors.alreadyJoined],
    ['household.member_limit', fr.households.join.errors.memberLimit],
  ])('explains a refused join (%s) and stays', async (code, text) => {
    const api = { preview: vi.fn(() => of(preview)), accept: vi.fn(() => throwError(() => error(code))) };
    const { router } = await renderJoin('/rejoindre#tok', api);
    await userEvent.click(screen.getByRole('button', { name: fr.households.join.accept }));
    await settle();
    expect(screen.getByText(text)).toBeTruthy();
    expect(router.url).toBe('/rejoindre#tok');
  });

  it('declines by going home', async () => {
    const api = { preview: vi.fn(() => of(preview)), accept: vi.fn() };
    const { router } = await renderJoin('/rejoindre#tok', api);
    await userEvent.click(screen.getByRole('button', { name: fr.households.join.decline }));
    await settle();
    expect(router.url).toBe('/');
    expect(api.accept).not.toHaveBeenCalled();
  });
});
