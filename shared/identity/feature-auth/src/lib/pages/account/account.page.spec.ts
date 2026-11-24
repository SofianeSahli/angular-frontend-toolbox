import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Account } from '@shared/identity-data-access';
import fr from '../../../i18n/fr.json';
import { failed, fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { AccountPage } from './account.page';

const ACCOUNT: Account = { id: 'a1', name: 'Amira', email: 'amira@exemple.com', phone: null, locale: 'fr', twoFactorEnabled: false };

function signedInStore(account: Partial<Account> = {}) {
  const store = fakeSessionStore();
  store.account.set({ ...ACCOUNT, ...account });
  return store;
}

describe('AccountPage', () => {
  it('shows the profile read-only, with "not provided" for a missing phone', async () => {
    await renderPage(AccountPage, { url: '/compte', store: signedInStore() });
    expect(screen.getByRole('heading', { level: 1, name: fr.identity.account.title })).toBeTruthy();
    expect(screen.getByText('Amira')).toBeTruthy();
    expect(screen.getByText('amira@exemple.com')).toBeTruthy();
    expect(screen.getByText(fr.identity.account.notProvided)).toBeTruthy();
    expect(screen.getByText('Français')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('turns two-step sign-in on and confirms with a toast', async () => {
    const store = signedInStore();
    store.enableTwoFactor.mockImplementation(async () => {
      store.account.update((account) => account && { ...account, twoFactorEnabled: true });
      return { outcome: 'done' };
    });
    const { toasts } = await renderPage(AccountPage, { url: '/compte', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.account.enable }));
    await settle();
    expect(store.enableTwoFactor).toHaveBeenCalled();
    expect(toasts()).toEqual([expect.objectContaining({ message: fr.identity.account.twoFactorEnabled, tone: 'success' })]);
    expect(screen.getByText(fr.identity.account.on)).toBeTruthy();
  });

  it('turns two-step sign-in off with the emailed code', async () => {
    const store = signedInStore({ twoFactorEnabled: true });
    const { toasts } = await renderPage(AccountPage, { url: '/compte', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.account.disable }));
    await settle();
    expect(store.requestDisableCode).toHaveBeenCalled();

    fireEvent.input(screen.getByLabelText(fr.identity.fields.code), { target: { value: '654321' } });
    await settle();
    expect(store.disableTwoFactor).toHaveBeenCalledWith('654321', expect.arrayContaining(['two_factor.not_enabled']));
    expect(toasts()).toEqual([expect.objectContaining({ message: fr.identity.account.twoFactorDisabled })]);
  });

  it('shows a wrong disable code on the code field', async () => {
    const store = signedInStore({ twoFactorEnabled: true });
    store.disableTwoFactor.mockResolvedValue(failed('validation', 422, 'validation.failed', { code: ['code.invalid'] }));
    await renderPage(AccountPage, { url: '/compte', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.account.disable }));
    await settle();
    fireEvent.input(screen.getByLabelText(fr.identity.fields.code), { target: { value: '000000' } });
    await settle();
    expect(screen.getByRole('alert').textContent).toContain(fr.identity.errors.code.invalid);
  });

  it.each(['two_factor.already_enabled', 'two_factor.not_enabled'])('reloads the account on %s', async (code) => {
    const store = signedInStore();
    store.enableTwoFactor.mockResolvedValue(failed('conflict', 409, code));
    await renderPage(AccountPage, { url: '/compte', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.account.enable }));
    await settle();
    expect(store.refreshAccount).toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('signs out and goes to sign-in', async () => {
    const store = signedInStore();
    const { router } = await renderPage(AccountPage, { url: '/compte', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.account.signOut }));
    await settle();
    expect(store.signOut).toHaveBeenCalled();
    expect(router.url).toBe('/connexion');
  });
});
