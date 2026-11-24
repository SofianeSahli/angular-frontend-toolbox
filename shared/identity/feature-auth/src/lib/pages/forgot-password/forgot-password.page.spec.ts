import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { ForgotPasswordPage } from './forgot-password.page';

async function submit(email: string) {
  if (email) await userEvent.type(screen.getByLabelText(fr.identity.fields.email), email);
  await userEvent.click(screen.getByRole('button', { name: fr.identity.forgotPassword.submit }));
  await settle();
}

describe('ForgotPasswordPage', () => {
  it('says a code is sent if an account exists, then goes to the reset page', async () => {
    const { store, router } = await renderPage(ForgotPasswordPage, { url: '/mot-de-passe-oublie' });
    expect(screen.getByText(fr.identity.forgotPassword.lead)).toBeTruthy();
    await submit('amira@exemple.com');
    expect(store.forgotPassword).toHaveBeenCalledWith('amira@exemple.com', ['request.throttled']);
    expect(router.url).toBe('/mot-de-passe/nouveau');
  });

  it('sends nothing without a valid email', async () => {
    const { store } = await renderPage(ForgotPasswordPage, { url: '/mot-de-passe-oublie' });
    await submit('');
    expect(store.forgotPassword).not.toHaveBeenCalled();
    expect(screen.getByText('Ce champ est obligatoire.')).toBeTruthy();
  });

  it('asks to wait when throttled', async () => {
    const store = fakeSessionStore();
    store.forgotPassword.mockResolvedValue(failed('throttled', 429, 'request.throttled', {}, 30));
    await renderPage(ForgotPasswordPage, { url: '/mot-de-passe-oublie', store });
    await submit('amira@exemple.com');
    expect(screen.getByRole('alert').textContent).toContain('Réessayez dans 30 s');
    expect(screen.getByRole('button', { name: fr.identity.forgotPassword.submit })).toHaveProperty('disabled', true);
  });
});
