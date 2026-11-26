import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { FakeSessionStore, failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { ForgotPasswordPage } from './forgot-password.page';

async function requestCode(email: string) {
  if (email) await userEvent.type(screen.getByLabelText(fr.identity.fields.email), email);
  await userEvent.click(screen.getByRole('button', { name: fr.identity.forgotPassword.submit }));
  await settle();
}

async function reset(code = '123456', password = 'new-secret-phrase') {
  fireEvent.input(screen.getByLabelText(fr.identity.fields.code), { target: { value: code } });
  if (password) await userEvent.type(screen.getByLabelText(fr.identity.fields.newPassword), password);
  await userEvent.click(screen.getByRole('button', { name: fr.identity.resetPassword.submit }));
  await settle();
}

async function atStepTwo(store: FakeSessionStore = fakeSessionStore()) {
  const view = await renderPage(ForgotPasswordPage, { url: '/mot-de-passe-oublie', store });
  await requestCode('amira@exemple.com');
  return { ...view, store };
}

describe('ForgotPasswordPage, two steps on one page (spec 009 REQ-13.4)', () => {
  it('asks for the e-mail, then shows a neutral message and the code step on the same page', async () => {
    const { store, router } = await atStepTwo();
    expect(store.forgotPassword).toHaveBeenCalledWith('amira@exemple.com', ['request.throttled']);
    expect(router.url).toBe('/mot-de-passe-oublie');
    expect(screen.getByRole('status').textContent).toContain(fr.identity.resetPassword.sentTo);
    expect(screen.getByRole('status').textContent).toContain('amira@exemple.com');
    expect(screen.getByLabelText(fr.identity.fields.code)).toBeTruthy();
  });

  it('sends nothing without a valid email', async () => {
    const { store } = await renderPage(ForgotPasswordPage, { url: '/mot-de-passe-oublie' });
    await requestCode('');
    expect(store.forgotPassword).not.toHaveBeenCalled();
    expect(screen.getByText('Ce champ est obligatoire.')).toBeTruthy();
  });

  it('asks to wait when throttled', async () => {
    const store = fakeSessionStore();
    store.forgotPassword.mockResolvedValue(failed('throttled', 429, 'request.throttled', {}, 30));
    await renderPage(ForgotPasswordPage, { url: '/mot-de-passe-oublie', store });
    await requestCode('amira@exemple.com');
    expect(screen.getByRole('alert').textContent).toContain('Réessayez dans 30 s');
    expect(screen.getByRole('button', { name: fr.identity.forgotPassword.submit })).toHaveProperty('disabled', true);
  });

  it('resets the password, confirms with a toast and goes to sign-in', async () => {
    const { store, router, toasts } = await atStepTwo();
    await reset();
    expect(store.resetPassword).toHaveBeenCalledWith('amira@exemple.com', '123456', 'new-secret-phrase', expect.any(Array));
    expect(toasts()).toEqual([expect.objectContaining({ message: fr.identity.resetPassword.done, tone: 'success' })]);
    expect(router.url).toBe('/connexion');
  });

  it('refuses an incomplete code and a short password', async () => {
    const { store } = await atStepTwo();
    await reset('12', 'short');
    expect(store.resetPassword).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.incomplete);
    expect(screen.getByText('8 caractères minimum.')).toBeTruthy();
  });

  it('puts an invalid code on the code field', async () => {
    const store = fakeSessionStore();
    store.resetPassword.mockResolvedValue(failed('validation', 422, 'validation.failed', { code: ['code.invalid'] }));
    await atStepTwo(store);
    await reset();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.invalid);
  });

  it('goes back to the e-mail step to change the address', async () => {
    await atStepTwo();
    await userEvent.click(screen.getByRole('button', { name: fr.identity.forgotPassword.changeEmail }));
    expect(screen.getByLabelText(fr.identity.fields.email)).toBeTruthy();
  });
});
