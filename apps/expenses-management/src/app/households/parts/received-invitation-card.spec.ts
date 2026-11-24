import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { TestBed } from '@angular/core/testing';
import fr from '../../../../public/i18n/fr.json';
import { invitation } from '../testing';
import { ReceivedInvitationCard } from './received-invitation-card';

async function renderCard(busy: 'accept' | 'decline' | null = null) {
  const accept = vi.fn();
  const decline = vi.fn();
  const view = await render(ReceivedInvitationCard, {
    providers: [provideTranslateService({ lang: 'fr' })],
    inputs: { invitation: invitation('i1'), busy },
    on: { accept, decline },
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { accept, decline };
}

describe('ReceivedInvitationCard', () => {
  it('shows the household, the inviter and the expiry date', async () => {
    await renderCard();
    expect(screen.getByText('Les Martin').tagName).toBe('BDI');
    expect(screen.getByText('Sami').tagName).toBe('BDI');
    expect(screen.getByText(/2026-11-15/)).toBeTruthy();
  });

  it('emits accept and decline', async () => {
    const { accept, decline } = await renderCard();
    await userEvent.click(screen.getByRole('button', { name: fr.households.invitation.accept }));
    await userEvent.click(screen.getByRole('button', { name: fr.households.invitation.decline }));
    expect(accept).toHaveBeenCalledOnce();
    expect(decline).toHaveBeenCalledOnce();
  });

  it('disables both buttons while an answer is in flight', async () => {
    await renderCard('accept');
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.disabled || button.getAttribute('aria-disabled') === 'true')).toBe(true);
  });
});
