import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../public/i18n/fr.json';
import { ApiError } from '@shared/http-data-access';
import { FakeStores, book, failed, fakeStores, renderPage, settle } from '../testing';
import { StoreResult } from '../data/store-result';
import { BookNewPage } from './book-new.page';

const t = fr.households;
const otherCurrencyField = new RegExp(t.newBook.otherCurrencyField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

describe('BookNewPage', () => {
  let stores: FakeStores;

  beforeEach(() => {
    stores = fakeStores();
    stores.household.household.set({ id: 'h1', name: 'Les Martin', role: 'owner' });
  });

  async function open(url: string) {
    return renderPage(BookNewPage, stores, url);
  }

  async function submit(name = 'Courses') {
    await userEvent.type(screen.getByRole('textbox', { name: new RegExp(t.newBook.name) }), name);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^(${t.newBook.submit}|${t.newBook.submitFirst})$`) }));
    await settle();
  }

  it('ends the first run on "Créer et noter une première dépense" (spec 009 REQ-13.5)', async () => {
    await open('/carnets/nouveau?foyer=1');
    expect(screen.getByRole('button', { name: t.newBook.submitFirst })).toBeTruthy();
  });

  it('keeps the plain label when the user already has a book', async () => {
    stores.books.books.set([book('a')]);
    await open('/carnets/nouveau');
    expect(screen.getByRole('button', { name: t.newBook.submit })).toBeTruthy();
  });

  it('shows the household book as step 2 of 2 and the personal book as 1 of 1', async () => {
    await open('/carnets/nouveau?foyer=1');
    expect(screen.getByRole('heading', { level: 1, name: t.newBook.titleHousehold })).toBeTruthy();
  });

  it('titles the personal book without the flag', async () => {
    await open('/carnets/nouveau');
    expect(screen.getByRole('heading', { level: 1, name: t.newBook.titlePersonal })).toBeTruthy();
  });

  it('warns that the currency is final', async () => {
    await open('/carnets/nouveau');
    expect(screen.getByText(t.newBook.currencyFinal)).toBeTruthy();
  });

  it('refuses an empty name', async () => {
    await open('/carnets/nouveau');
    await userEvent.click(screen.getByRole('button', { name: t.newBook.submitFirst }));
    await settle();
    expect(stores.books.create).not.toHaveBeenCalled();
  });

  it('sends only the name for a personal book when nothing else was chosen', async () => {
    const { router } = await open('/carnets/nouveau');
    await submit();
    expect(stores.books.create).toHaveBeenCalledWith({ name: 'Courses' });
    expect(router.url).toBe('/');
  });

  it('sends the household id, from the store, for the household book', async () => {
    await open('/carnets/nouveau?foyer=1');
    await submit();
    expect(stores.books.create).toHaveBeenCalledWith({ name: 'Courses', householdId: 'h1' });
  });

  it('sends the chosen currency and timezone', async () => {
    await open('/carnets/nouveau');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: new RegExp(t.newBook.currency) }), 'EUR');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: new RegExp(t.newBook.timezone) }), 'Europe/Paris');
    await submit();
    expect(stores.books.create).toHaveBeenCalledWith({ name: 'Courses', currency: 'EUR', timezone: 'Europe/Paris' });
  });

  it('reveals a 3-letter field for "Autre…" and upper-cases it', async () => {
    await open('/carnets/nouveau');
    expect(screen.queryByRole('textbox', { name: otherCurrencyField })).toBeNull();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: new RegExp(t.newBook.currency) }), t.newBook.otherCurrency);
    await userEvent.type(screen.getByRole('textbox', { name: otherCurrencyField }), 'jpy');
    await submit();
    expect(stores.books.create).toHaveBeenCalledWith({ name: 'Courses', currency: 'JPY' });
  });

  it('refuses an "Autre…" code that is not 3 letters', async () => {
    await open('/carnets/nouveau');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: new RegExp(t.newBook.currency) }), t.newBook.otherCurrency);
    await userEvent.type(screen.getByRole('textbox', { name: otherCurrencyField }), 'jp');
    await submit();
    expect(stores.books.create).not.toHaveBeenCalled();
  });

  it('puts server field codes on their fields', async () => {
    const error = new ApiError('validation', 422, 'validation.failed', { timezone: ['timezone.iana_timezone'] }, null, 'r');
    stores.books.create.mockResolvedValue({ outcome: 'error', error } satisfies StoreResult);
    await open('/carnets/nouveau');
    await submit();
    expect(screen.getByText(t.fields.timezone.iana_timezone)).toBeTruthy();
  });

  it('says five personal books is the maximum and goes home', async () => {
    stores.books.create.mockResolvedValue(failed('book.limit_reached'));
    const view = await open('/carnets/nouveau');
    await submit();
    expect(view.router.url).toBe('/');
    expect(view.toasts().map((toast) => toast.message)).toEqual([t.newBook.limitReached]);
  });

  it.each(['household.forbidden', 'book.household_has_book', 'household_id.not_found'])(
    'reloads the workspace and goes to the welcome page on stale state %s',
    async (code) => {
      stores.books.create.mockResolvedValue(failed(code, code === 'household.forbidden' ? 403 : 422));
      const { router } = await open('/carnets/nouveau?foyer=1');
      await submit();
      expect(stores.books.load).toHaveBeenCalledWith({ force: true });
      expect(router.url).toBe('/bienvenue');
    },
  );

  it('goes home instead when a book now exists', async () => {
    stores.books.create.mockImplementation(async () => {
      stores.books.books.set([book('hb', 'household')]);
      return failed('book.household_has_book');
    });
    const { router } = await open('/carnets/nouveau?foyer=1');
    await submit();
    expect(router.url).toBe('/');
  });

  it('shows the throttling delay above the form', async () => {
    stores.books.create.mockResolvedValue(failed('request.throttled', 429, 'throttled', 45));
    const { router } = await open('/carnets/nouveau');
    await submit();
    expect(screen.getByRole('alert').textContent).toContain('45 s');
    expect(router.url).toBe('/carnets/nouveau');
  });

  it('goes to the welcome page from the household book step', async () => {
    const { router } = await open('/carnets/nouveau?foyer=1');
    await userEvent.click(screen.getByRole('button', { name: fr.ui.back }));
    await settle();
    expect(router.url).toBe('/bienvenue');
  });

  it('quits home when the user has a book, else to the welcome page', async () => {
    stores.books.books.set([book('p1')]);
    const { router } = await open('/carnets/nouveau');
    await userEvent.click(screen.getByRole('button', { name: fr.ui.close }));
    await settle();
    expect(router.url).toBe('/');
  });
});
