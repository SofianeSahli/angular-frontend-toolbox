import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UI_DIALOG_CONTEXT } from '@shared/ui-organisms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import fr from '../../../../../public/i18n/fr.json';
import { HouseholdStore } from '../../data/household.store';
import { QrInvitationsApi } from '../../data/qr-invitations-api';
import { InviteSheet, countdownText } from './invite-sheet';

const settle = () => new Promise((resolve) => setTimeout(resolve));

async function renderSheet(create = vi.fn(() => of({ token: 'tok', expiresAt: new Date(Date.now() + 10 * 60 * 1000) }))) {
  const close = vi.fn();
  const household = {
    household: signal({ id: 'h1', name: 'Les Martin', role: 'owner' as const }),
    invite: vi.fn().mockResolvedValue({ outcome: 'done' }),
  };
  const view = await render(InviteSheet, {
    providers: [
      provideTranslateService({ lang: 'fr' }),
      { provide: UI_DIALOG_CONTEXT, useValue: { titleId: 't', sheet: true, close } },
      { provide: HouseholdStore, useValue: household },
      { provide: QrInvitationsApi, useValue: { create } },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { view, close, household, create };
}

describe('InviteSheet (spec 009 REQ-11.2, 11.3)', () => {
  it('opens on the e-mail tab and invites by e-mail', async () => {
    const { view, household } = await renderSheet();
    expect(screen.getByRole('tab', { name: fr.households.invite.email }).getAttribute('aria-selected')).toBe('true');
    await userEvent.type(screen.getByRole('textbox'), 'sami@exemple.tn');
    await userEvent.click(screen.getByRole('button', { name: fr.households.household.invite.submit }));
    await settle();
    view.detectChanges();
    expect(household.invite).toHaveBeenCalledWith('sami@exemple.tn');
  });

  it('creates a QR code on the QR tab with a countdown, and a new one on demand', async () => {
    const { view, create } = await renderSheet();
    await userEvent.click(screen.getByRole('tab', { name: fr.households.invite.qr }));
    await settle();
    view.detectChanges();
    expect(create).toHaveBeenCalledWith('h1');
    expect(screen.getByRole('img', { name: fr.households.qr.label })).toBeTruthy();
    expect(view.container.textContent).toMatch(/10:00|9:59/);
    await userEvent.click(screen.getByRole('button', { name: fr.households.qr.newCode }));
    await settle();
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('dims an expired code and says so', async () => {
    const { view } = await renderSheet(vi.fn(() => of({ token: 'tok', expiresAt: new Date(Date.now() - 1000) })));
    await userEvent.click(screen.getByRole('tab', { name: fr.households.invite.qr }));
    await settle();
    view.detectChanges();
    expect(view.container.textContent).toContain(fr.households.qr.expired);
    expect(view.container.querySelector('app-qr-code')?.classList).toContain('qr-code--expired');
  });

  it('closes when the household is gone', async () => {
    const gone = new ApiError('not-found', 404, 'household.not_found', {}, null, 'r');
    const { close } = await renderSheet(vi.fn(() => throwError(() => gone)));
    await userEvent.click(screen.getByRole('tab', { name: fr.households.invite.qr }));
    await settle();
    expect(close).toHaveBeenCalledWith('gone');
  });

  it('shows the throttle wait', async () => {
    const throttled = new ApiError('throttled', 429, 'request.throttled', {}, 30, 'r');
    const first = await renderSheet(vi.fn(() => throwError(() => throttled)));
    await userEvent.click(screen.getByRole('tab', { name: fr.households.invite.qr }));
    await settle();
    first.view.detectChanges();
    expect(screen.getByRole('alert').textContent).toContain('30');
  });

  it('writes the countdown as minutes and seconds', () => {
    expect([countdownText(600), countdownText(582), countdownText(-3)]).toEqual(['10:00', '9:42', '0:00']);
  });
});
