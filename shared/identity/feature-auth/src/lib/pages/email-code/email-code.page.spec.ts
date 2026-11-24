import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { TWO_FACTOR, failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { EmailCodePage } from './email-code.page';

function storeWithEmail() {
  const store = fakeSessionStore();
  store.pendingEmail.set('amira@exemple.com');
  return store;
}

async function typeCode(code: string) {
  fireEvent.input(screen.getByLabelText(fr.identity.fields.code), { target: { value: code } });
  await settle();
}

describe('EmailCodePage', () => {
  it('goes to sign-up when no email is waiting for confirmation', async () => {
    const { router } = await renderPage(EmailCodePage, { url: '/inscription/code' });
    expect(router.url).toBe('/inscription');
  });

  it('shows the address and confirms on its own at the 6th digit', async () => {
    const store = storeWithEmail();
    store.returnUrl.set('/compte');
    const { router } = await renderPage(EmailCodePage, { url: '/inscription/code', store });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('amira@exemple.com')).toBeTruthy();
    await typeCode('123456');
    expect(store.confirmEmail).toHaveBeenCalledWith('amira@exemple.com', '123456', expect.any(Array));
    expect(router.url).toBe('/compte');
  });

  it('goes to the two-factor page when a code is required', async () => {
    const store = storeWithEmail();
    store.confirmEmail.mockResolvedValue(TWO_FACTOR);
    const { router } = await renderPage(EmailCodePage, { url: '/inscription/code', store });
    await typeCode('123456');
    expect(router.url).toBe('/connexion/code');
  });

  it('asks for the 6 digits when Confirm is pressed too early', async () => {
    const store = storeWithEmail();
    await renderPage(EmailCodePage, { url: '/inscription/code', store });
    await typeCode('123');
    await userEvent.click(screen.getByRole('button', { name: fr.identity.emailCode.submit }));
    await settle();
    expect(store.confirmEmail).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.incomplete);
  });

  it('shows a wrong code and clears it', async () => {
    const store = storeWithEmail();
    store.confirmEmail.mockResolvedValue(failed('validation', 422, 'validation.failed', { code: ['code.invalid'] }));
    await renderPage(EmailCodePage, { url: '/inscription/code', store });
    await typeCode('000000');
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.invalid);
    expect((screen.getByLabelText(fr.identity.fields.code) as HTMLInputElement).value).toBe('');
  });

  it('allows a new code after 60 seconds and restarts the wait', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const store = storeWithEmail();
      await renderPage(EmailCodePage, { url: '/inscription/code', store });
      const resend = () => screen.getByRole('button', { name: fr.identity.emailCode.resend });
      expect(resend()).toHaveProperty('disabled', true);
      expect(screen.getByText(/Nouveau code possible dans 1:00/)).toBeTruthy();

      await vi.advanceTimersByTimeAsync(60_000);
      await settle();
      expect(resend()).toHaveProperty('disabled', false);

      await userEvent.click(resend());
      await settle();
      expect(store.resendCode).toHaveBeenCalledWith('amira@exemple.com', expect.any(Array));
      expect(resend()).toHaveProperty('disabled', true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits as long as the server asks when resending is throttled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const store = storeWithEmail();
      store.resendCode.mockResolvedValue(failed('throttled', 429, 'request.throttled', {}, 125));
      await renderPage(EmailCodePage, { url: '/inscription/code', store });
      await vi.advanceTimersByTimeAsync(60_000);
      await settle();
      await userEvent.click(screen.getByRole('button', { name: fr.identity.emailCode.resend }));
      await settle();
      expect(screen.getByText(/Nouveau code possible dans 2:0\d/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('goes back to sign-up to change the address', async () => {
    const store = storeWithEmail();
    const { router } = await renderPage(EmailCodePage, { url: '/inscription/code', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.emailCode.wrongAddress }));
    await settle();
    expect(router.url).toBe('/inscription');
  });
});
