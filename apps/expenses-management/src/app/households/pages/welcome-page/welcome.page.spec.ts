import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../../public/i18n/fr.json';
import { FakeStores, book, failed, fakeStores, invitation, renderPage, settle } from '../../testing';
import { WelcomePage } from './welcome.page';

const t = fr.households;

describe('WelcomePage', () => {
  let stores: FakeStores;

  beforeEach(() => {
    stores = fakeStores();
  });

  it('shows a skeleton, not the choice, while the workspace loads', async () => {
    let release: () => void = () => undefined;
    stores.books.load.mockReturnValue(new Promise((resolve) => (release = () => resolve({ outcome: 'done' }))));
    const view = await renderPage(WelcomePage, stores, '/bienvenue');
    expect(screen.getByRole('status', { name: t.welcome.loading })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.welcome.continue })).toBeNull();
    release();
    await settle(view);
    expect(screen.getByRole('button', { name: t.welcome.continue })).toBeTruthy();
  });

  describe('state A, no household', () => {
    it('offers both choices and goes to the household form', async () => {
      const { router } = await renderPage(WelcomePage, stores, '/bienvenue');
      expect(screen.getByRole('heading', { level: 1, name: t.welcome.title })).toBeTruthy();
      await userEvent.click(screen.getByRole('button', { name: t.welcome.continue }));
      await settle();
      expect(router.url).toBe('/foyer/nouveau');
    });

    it('goes to the personal book form when that choice is picked', async () => {
      const { router } = await renderPage(WelcomePage, stores, '/bienvenue');
      await userEvent.click(screen.getByRole('radio', { name: new RegExp(t.welcome.personal.title) }));
      await userEvent.click(screen.getByRole('button', { name: t.welcome.continue }));
      await settle();
      expect(router.url).toBe('/carnets/nouveau');
    });

    it('loads the invitations after the workspace', async () => {
      await renderPage(WelcomePage, stores, '/bienvenue');
      expect(stores.books.load.mock.invocationCallOrder[0]).toBeLessThan(stores.invitations.load.mock.invocationCallOrder[0]);
    });

    it('shows no card when the invitations failed to load', async () => {
      stores.invitations.load.mockResolvedValue(failed('http.unknown', 500, 'server'));
      await renderPage(WelcomePage, stores, '/bienvenue');
      expect(screen.queryByRole('article')).toBeNull();
      expect(screen.getByRole('button', { name: t.welcome.continue })).toBeTruthy();
    });
  });

  describe('state B, owner without a household book', () => {
    beforeEach(() => {
      stores.household.household.set({ id: 'h1', name: 'Les Martin', role: 'owner' });
    });

    it('shows the resume card linking to the household book form', async () => {
      await renderPage(WelcomePage, stores, '/bienvenue');
      expect(screen.getByRole('heading', { name: /Les Martin/ })).toBeTruthy();
      const link = screen.getByRole('link', { name: t.welcome.resume.action });
      expect(link.getAttribute('href')).toBe('/carnets/nouveau?foyer=1');
      expect(screen.getByRole('link', { name: t.welcome.personal.title })).toBeTruthy();
      expect(screen.queryByRole('button', { name: t.welcome.continue })).toBeNull();
    });
  });

  describe('state C, member without a household book', () => {
    it('says the owner has not created the book yet', async () => {
      stores.household.household.set({ id: 'h1', name: 'Les Martin', role: 'member' });
      await renderPage(WelcomePage, stores, '/bienvenue');
      expect(screen.getByRole('status').textContent).toContain(t.welcome.memberWaiting);
      expect(screen.getByRole('link', { name: t.welcome.personal.title })).toBeTruthy();
    });
  });

  describe('received invitations', () => {
    beforeEach(() => {
      stores.invitations.received.set([invitation('i1'), invitation('i2', 'Les Dupont')]);
    });

    it('shows one card per invitation above the choice', async () => {
      await renderPage(WelcomePage, stores, '/bienvenue');
      expect(screen.getAllByRole('article')).toHaveLength(2);
    });

    it('accepts, selects the household book and goes home', async () => {
      stores.invitations.accept.mockImplementation(async () => {
        stores.books.books.set([book('hb', 'household')]);
        return { outcome: 'done' };
      });
      const { router } = await renderPage(WelcomePage, stores, '/bienvenue');
      await userEvent.click(screen.getAllByRole('button', { name: t.invitation.accept })[0]);
      await settle();
      expect(stores.invitations.accept).toHaveBeenCalledWith('i1');
      expect(stores.books.select).toHaveBeenCalledWith('hb');
      expect(router.url).toBe('/');
    });

    it('stays on the page when the household has no book yet', async () => {
      const { router } = await renderPage(WelcomePage, stores, '/bienvenue');
      await userEvent.click(screen.getAllByRole('button', { name: t.invitation.accept })[0]);
      await settle();
      expect(stores.books.select).not.toHaveBeenCalled();
      expect(router.url).toBe('/bienvenue');
    });

    it('declines and shows a toast', async () => {
      const view = await renderPage(WelcomePage, stores, '/bienvenue');
      await userEvent.click(screen.getAllByRole('button', { name: t.invitation.decline })[0]);
      await settle(view);
      expect(stores.invitations.decline).toHaveBeenCalledWith('i1');
      expect(view.toasts().map((toast) => toast.message)).toEqual([t.invitation.declined]);
    });

    it.each([
      ['invitation.not_found', t.errors.invitation.not_found],
      ['household.already_joined', t.errors.household.already_joined],
      ['household.member_limit', t.errors.household.member_limit],
    ])('says why an accept answered %s failed', async (code, text) => {
      stores.invitations.accept.mockResolvedValue(failed(code));
      await renderPage(WelcomePage, stores, '/bienvenue');
      await userEvent.click(screen.getAllByRole('button', { name: t.invitation.accept })[0]);
      await settle();
      expect(screen.getByRole('alert').textContent).toContain(text);
    });

    it('says why a decline failed', async () => {
      stores.invitations.decline.mockResolvedValue(failed('invitation.not_found', 404, 'not-found'));
      await renderPage(WelcomePage, stores, '/bienvenue');
      await userEvent.click(screen.getAllByRole('button', { name: t.invitation.decline })[0]);
      await settle();
      expect(screen.getByRole('alert').textContent).toContain(t.errors.invitation.not_found);
    });
  });
});
