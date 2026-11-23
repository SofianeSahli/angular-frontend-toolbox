import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { TwoFactorPage } from './two-factor.page';

function storeWithPending() {
  const store = fakeSessionStore();
  store.pendingTwoFactor.set({ pendingSignIn: 'pending-1', expiresAt: Date.now() + 600_000, email: 'amira@exemple.com' });
  return store;
}

async function typeCode(code: string) {
  fireEvent.input(screen.getByLabelText(fr.identity.fields.code), { target: { value: code } });
  await settle();
}

describe('TwoFactorPage', () => {
  it('goes to sign-in with a message when nothing is pending', async () => {
    const { router, toasts } = await renderPage(TwoFactorPage, { url: '/connexion/code' });
    expect(router.url).toBe('/connexion');
    expect(toasts().map((toast) => toast.message)).toEqual([fr.identity.twoFactor.expired]);
  });

  it('confirms at the 6th digit and goes to the return URL', async () => {
    const store = storeWithPending();
    store.returnUrl.set('/compte');
    const { router } = await renderPage(TwoFactorPage, { url: '/connexion/code', store });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('amira@exemple.com')).toBeTruthy();
    await typeCode('123456');
    expect(store.confirmTwoFactor).toHaveBeenCalledWith('123456', expect.arrayContaining(['auth.pending_invalid']));
    expect(router.url).toBe('/compte');
  });

  it('starts again from sign-in when the pending sign-in is no longer valid', async () => {
    const store = storeWithPending();
    store.confirmTwoFactor.mockResolvedValue(failed('unauthenticated', 401, 'auth.pending_invalid'));
    const { router, toasts } = await renderPage(TwoFactorPage, { url: '/connexion/code', store });
    await typeCode('123456');
    expect(router.url).toBe('/connexion');
    expect(toasts().map((toast) => toast.message)).toEqual([fr.identity.twoFactor.expired]);
  });

  it('shows a wrong code and clears it', async () => {
    const store = storeWithPending();
    store.confirmTwoFactor.mockResolvedValue(failed('validation', 422, 'validation.failed', { code: ['code.invalid'] }));
    await renderPage(TwoFactorPage, { url: '/connexion/code', store });
    await typeCode('000000');
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.invalid);
  });

  it('sends a new code after the wait', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const store = storeWithPending();
      await renderPage(TwoFactorPage, { url: '/connexion/code', store });
      await vi.advanceTimersByTimeAsync(60_000);
      await settle();
      await userEvent.click(screen.getByRole('button', { name: fr.identity.emailCode.resend }));
      await settle();
      expect(store.resendTwoFactor).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('links back to sign-in', async () => {
    await renderPage(TwoFactorPage, { url: '/connexion/code', store: storeWithPending() });
    expect(screen.getByRole('link', { name: fr.identity.common.back }).getAttribute('href')).toBe('/connexion');
  });
});
