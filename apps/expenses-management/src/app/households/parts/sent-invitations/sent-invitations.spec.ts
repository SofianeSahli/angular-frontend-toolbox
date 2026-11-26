import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../../public/i18n/fr.json';
import { Invitation } from '../../data/models';
import { sentInvitation } from '../../testing';
import { SentInvitations } from './sent-invitations';

const t = fr.households.household;

async function renderList(invitations: readonly Invitation[]) {
  const cancel = vi.fn();
  const view = await render(SentInvitations, {
    providers: [provideTranslateService({ lang: 'fr' })],
    inputs: { invitations },
    on: { cancelInvitation: cancel },
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { cancel };
}

describe('SentInvitations', () => {
  it('shows a one-line empty text when there is no invitation', async () => {
    await renderList([]);
    expect(screen.getByText(t.noInvitations)).toBeTruthy();
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('lists invitations oldest first with the email in a ltr bdi and the expiry date', async () => {
    const recent = { ...sentInvitation('b', 'b@exemple.tn'), createdAt: new Date(2026, 10, 5) };
    const old = { ...sentInvitation('a', 'a@exemple.tn'), createdAt: new Date(2026, 10, 1) };
    await renderList([recent, old]);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0].textContent).toContain('a@exemple.tn');
    expect(rows[1].textContent).toContain('b@exemple.tn');
    const email = screen.getByText('a@exemple.tn');
    expect(email.tagName).toBe('BDI');
    expect(email.getAttribute('dir')).toBe('ltr');
    expect(rows[0].textContent).toContain('2026-11-15');
  });

  it('emits cancelInvitation with the invitation', async () => {
    const invitation = sentInvitation('a');
    const { cancel } = await renderList([invitation]);
    await userEvent.click(within(screen.getByRole('listitem')).getByRole('button', { name: new RegExp(t.cancelInvitation) }));
    expect(cancel).toHaveBeenCalledWith(invitation);
  });
});
