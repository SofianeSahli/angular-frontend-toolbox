import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../i18n/fr.json';
import { fakeSessionStore, renderPage, settle } from '../../testing/page-harness';
import { UnavailablePage } from './unavailable.page';

function unavailableStore() {
  const store = fakeSessionStore();
  store.unavailable.set(true);
  return store;
}

describe('UnavailablePage', () => {
  it('retries the session and goes back to the requested page once the service answers', async () => {
    const store = unavailableStore();
    store.restore.mockImplementation(async () => store.unavailable.set(false));
    const { router } = await renderPage(UnavailablePage, { url: '/indisponible?returnUrl=%2Fcompte', store });
    expect(screen.getByRole('heading', { level: 1, name: fr.identity.unavailable.title })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: fr.identity.unavailable.retry }));
    await settle();
    expect(store.restore).toHaveBeenCalled();
    expect(router.url).toBe('/compte');
  });

  it('stays when the service is still down', async () => {
    const store = unavailableStore();
    const { router } = await renderPage(UnavailablePage, { url: '/indisponible?returnUrl=%2Fcompte', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.unavailable.retry }));
    await settle();
    expect(router.url).toBe('/indisponible?returnUrl=%2Fcompte');
  });

  it('ignores an external return URL', async () => {
    const store = unavailableStore();
    store.restore.mockImplementation(async () => store.unavailable.set(false));
    const { router } = await renderPage(UnavailablePage, { url: '/indisponible?returnUrl=https%3A%2F%2Fevil.example', store });
    await userEvent.click(screen.getByRole('button', { name: fr.identity.unavailable.retry }));
    await settle();
    expect(router.url).toBe('/');
  });
});
