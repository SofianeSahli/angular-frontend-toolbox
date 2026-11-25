import { fireEvent, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../public/i18n/fr.json';
import { FakeStores, failed, fakeStores, renderPage, settle } from '../testing';
import { HouseholdNewPage } from './household-new.page';

const t = fr.households;

describe('HouseholdNewPage', () => {
  let stores: FakeStores;

  beforeEach(() => {
    stores = fakeStores();
  });

  async function submit(name: string) {
    const view = await renderPage(HouseholdNewPage, stores, '/foyer/nouveau');
    if (name !== '') await userEvent.type(screen.getByRole('textbox', { name: new RegExp(t.newHousehold.name) }), name);
    await userEvent.click(screen.getByRole('button', { name: t.newHousehold.submit }));
    await settle(view);
    return view;
  }

  it('has one h1 and a labelled name field', async () => {
    await renderPage(HouseholdNewPage, stores, '/foyer/nouveau');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: new RegExp(t.newHousehold.name) })).toBeTruthy();
  });

  it('refuses an empty name without calling the store', async () => {
    await submit('');
    expect(stores.household.create).not.toHaveBeenCalled();
    expect(screen.getByText(fr.ui.errors.required)).toBeTruthy();
  });

  it('refuses a blank name', async () => {
    await submit('   ');
    expect(stores.household.create).not.toHaveBeenCalled();
  });

  it('refuses a name longer than 60 characters', async () => {
    const view = await renderPage(HouseholdNewPage, stores, '/foyer/nouveau');
    fireEvent.input(screen.getByRole('textbox', { name: new RegExp(t.newHousehold.name) }), { target: { value: 'x'.repeat(61) } });
    await userEvent.click(screen.getByRole('button', { name: t.newHousehold.submit }));
    await settle(view);
    expect(stores.household.create).not.toHaveBeenCalled();
  });

  it('creates the household with a trimmed name and goes to step 2', async () => {
    const { router } = await submit('  Les Martin  ');
    expect(stores.household.create).toHaveBeenCalledWith('Les Martin');
    expect(router.url).toBe('/carnets/nouveau?foyer=1');
  });

  it('reloads the workspace and goes to the household when the limit is reached', async () => {
    stores.household.create.mockResolvedValue(failed('household.limit_reached'));
    const view = await submit('Les Martin');
    expect(stores.books.load).toHaveBeenCalledWith({ force: true });
    expect(view.router.url).toBe('/foyer');
    expect(view.toasts().map((toast) => toast.message)).toEqual([t.newHousehold.alreadyJoined]);
  });

  it('shows the throttling delay above the form and stays', async () => {
    stores.household.create.mockResolvedValue(failed('request.throttled', 429, 'throttled', 30));
    const { router } = await submit('Les Martin');
    expect(screen.getByRole('alert').textContent).toContain('30 s');
    expect(router.url).toBe('/foyer/nouveau');
  });

  it('goes back to the welcome page and quits home', async () => {
    const { router } = await renderPage(HouseholdNewPage, stores, '/foyer/nouveau');
    await userEvent.click(screen.getByRole('button', { name: fr.ui.back }));
    await settle();
    expect(router.url).toBe('/bienvenue');
  });
});
