import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { ResetPasswordPage } from './reset-password.page';

function storeWithEmail() {
  const store = fakeSessionStore();
  store.pendingEmail.set('amira@exemple.com');
  return store;
}

async function fillAndSubmit(code = '123456', password = 'new-secret-phrase') {
  fireEvent.input(screen.getByLabelText(fr.identity.fields.code), { target: { value: code } });
  if (password) await userEvent.type(screen.getByLabelText(fr.identity.fields.newPassword), password);
  await userEvent.click(screen.getByRole('button', { name: fr.identity.resetPassword.submit }));
  await settle();
}

describe('ResetPasswordPage', () => {
  it('goes to forgot password when no email is pending', async () => {
    const { router } = await renderPage(ResetPasswordPage, { url: '/mot-de-passe/nouveau' });
    expect(router.url).toBe('/mot-de-passe-oublie');
  });

  it('resets the password, confirms with a toast and goes to sign-in', async () => {
    const store = storeWithEmail();
    const { router, toasts } = await renderPage(ResetPasswordPage, { url: '/mot-de-passe/nouveau', store });
    await fillAndSubmit();
    expect(store.resetPassword).toHaveBeenCalledWith('amira@exemple.com', '123456', 'new-secret-phrase', expect.any(Array));
    expect(toasts()).toEqual([expect.objectContaining({ message: fr.identity.resetPassword.done, tone: 'success' })]);
    expect(router.url).toBe('/connexion');
  });

  it('refuses an incomplete code and a short password', async () => {
    const store = storeWithEmail();
    await renderPage(ResetPasswordPage, { url: '/mot-de-passe/nouveau', store });
    await fillAndSubmit('12', 'short');
    expect(store.resetPassword).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.incomplete);
    expect(screen.getByText('8 caractères minimum.')).toBeTruthy();
  });

  it('puts an invalid code on the code field', async () => {
    const store = storeWithEmail();
    store.resetPassword.mockResolvedValue(failed('validation', 422, 'validation.failed', { code: ['code.invalid'] }));
    await renderPage(ResetPasswordPage, { url: '/mot-de-passe/nouveau', store });
    await fillAndSubmit();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.invalid);
  });

  it('sends a new code after the wait', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const store = storeWithEmail();
      await renderPage(ResetPasswordPage, { url: '/mot-de-passe/nouveau', store });
      await vi.advanceTimersByTimeAsync(60_000);
      await settle();
      await userEvent.click(screen.getByRole('button', { name: fr.identity.emailCode.resend }));
      await settle();
      expect(store.forgotPassword).toHaveBeenCalledWith('amira@exemple.com', expect.any(Array));
    } finally {
      vi.useRealTimers();
    }
  });
});
