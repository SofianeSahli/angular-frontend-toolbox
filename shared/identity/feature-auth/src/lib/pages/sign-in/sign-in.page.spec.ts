import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { TWO_FACTOR, failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { SignInPage } from './sign-in.page';

async function fillAndSubmit(email = 'amira@exemple.com', password = 'secret-phrase') {
  await userEvent.type(screen.getByLabelText(fr.identity.fields.email), email);
  await userEvent.type(screen.getByLabelText(fr.identity.fields.password), password);
  await userEvent.click(screen.getByRole('button', { name: fr.identity.signIn.submit }));
  await settle();
}

describe('SignInPage', () => {
  it('has one heading, labelled fields and links to forgot password and sign-up', async () => {
    await renderPage(SignInPage, { url: '/connexion' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByLabelText(fr.identity.fields.email)).toBeTruthy();
    expect(screen.getByRole('link', { name: fr.identity.signIn.forgotPassword }).getAttribute('href')).toBe('/mot-de-passe-oublie');
    expect(screen.getByRole('link', { name: fr.identity.signIn.createAccount }).getAttribute('href')).toBe('/inscription');
  });

  it('keeps a safe return URL from the query', async () => {
    const { store } = await renderPage(SignInPage, { url: '/connexion?returnUrl=%2Fcompte' });
    expect(store.rememberReturnUrl).toHaveBeenCalledWith('/compte');
  });

  it('marks the fields and sends nothing when they are empty', async () => {
    const { store } = await renderPage(SignInPage, { url: '/connexion' });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.signIn.submit }));
    expect(store.signIn).not.toHaveBeenCalled();
    expect(screen.getAllByText('Ce champ est obligatoire.')).toHaveLength(2);
  });

  it('signs in and goes to the remembered return URL', async () => {
    const store = fakeSessionStore();
    store.returnUrl.set('/compte');
    const { router } = await renderPage(SignInPage, { url: '/connexion', store });
    await fillAndSubmit();
    expect(store.signIn).toHaveBeenCalledWith('amira@exemple.com', 'secret-phrase', expect.arrayContaining(['auth.invalid_credentials']));
    expect(router.url).toBe('/compte');
  });

  it('goes to the two-factor page when a code is required', async () => {
    const store = fakeSessionStore();
    store.signIn.mockResolvedValue(TWO_FACTOR);
    const { router } = await renderPage(SignInPage, { url: '/connexion', store });
    await fillAndSubmit();
    expect(router.url).toBe('/connexion/code');
  });

  it('shows one generic message for wrong credentials and keeps the email', async () => {
    const store = fakeSessionStore();
    store.signIn.mockResolvedValue(failed('unauthenticated', 401, 'auth.invalid_credentials'));
    await renderPage(SignInPage, { url: '/connexion', store });
    await fillAndSubmit();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.signIn.invalidCredentials);
    expect((screen.getByLabelText(fr.identity.fields.email) as HTMLInputElement).value).toBe('amira@exemple.com');
  });

  it('sends a new code and goes to the email-code page when the email is unconfirmed', async () => {
    const store = fakeSessionStore();
    store.signIn.mockResolvedValue(failed('forbidden', 403, 'auth.email_unconfirmed'));
    const { router } = await renderPage(SignInPage, { url: '/connexion', store });
    await fillAndSubmit();
    expect(store.resendCode).toHaveBeenCalledWith('amira@exemple.com', ['request.throttled']);
    expect(router.url).toBe('/inscription/code');
  });

  it('counts down and disables the submit button when locked', async () => {
    const store = fakeSessionStore();
    store.signIn.mockResolvedValue(failed('throttled', 429, 'auth.password_locked', {}, 2));
    await renderPage(SignInPage, { url: '/connexion', store });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await fillAndSubmit();
      expect(screen.getByRole('alert').textContent).toContain('Réessayez dans 2 s');
      expect(screen.getByRole('button', { name: fr.identity.signIn.submit })).toHaveProperty('disabled', true);

      await vi.advanceTimersByTimeAsync(2000);
      await settle();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByRole('button', { name: fr.identity.signIn.submit })).toHaveProperty('disabled', false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores a second submit while the first is running', async () => {
    const store = fakeSessionStore();
    let finish: () => void = () => undefined;
    store.signIn.mockReturnValue(new Promise((resolve) => (finish = () => resolve({ outcome: 'done' }))));
    await renderPage(SignInPage, { url: '/connexion', store });
    await fillAndSubmit();
    await userEvent.click(screen.getByRole('button', { name: fr.identity.signIn.submit }));
    expect(store.signIn).toHaveBeenCalledTimes(1);
    finish();
  });

  it('puts server field codes on their fields', async () => {
    const store = fakeSessionStore();
    store.signIn.mockResolvedValue(failed('validation', 422, 'validation.failed', { email: ['email.email'] }));
    await renderPage(SignInPage, { url: '/connexion', store });
    await fillAndSubmit();
    expect(screen.getByText(fr.identity.errors.email.email)).toBeTruthy();
  });
});
