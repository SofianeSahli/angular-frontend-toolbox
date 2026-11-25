import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideIcons } from '@shared/ui-atoms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../public/i18n/fr.json';
import { BooksStore } from '../households/data/books.store';
import { FakeStores, book, fakeStores } from '../households/testing';
import { BookSwitcher } from './book-switcher';
import { SHELL_ICONS } from './shell-icons';

@Component({ template: '' })
class Page {}

const t = fr.shell.books;

async function renderSwitcher(stores: FakeStores) {
  const view = await render(BookSwitcher, {
    inputs: { variant: 'bar' },
    providers: [
      provideRouter([{ path: '**', component: Page }]),
      provideTranslateService({ lang: 'fr' }),
      provideIcons(SHELL_ICONS),
      { provide: BooksStore, useValue: stores.books },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { view, router: TestBed.inject(Router) };
}

const trigger = () => screen.getByRole('button', { name: new RegExp(t.switcher) });

describe('BookSwitcher', () => {
  let stores: FakeStores;

  beforeEach(() => {
    stores = fakeStores();
    stores.books.books.set([book('h', 'household'), book('a'), book('b')]);
    stores.books.selectedBookId.set('a');
  });

  it('is not shown when there is no book', async () => {
    stores.books.books.set([]);
    stores.books.selectedBookId.set(null);
    await renderSwitcher(stores);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the selected book name in a bdi', async () => {
    await renderSwitcher(stores);
    expect(trigger().textContent).toContain('Carnet a');
    expect(screen.getByText('Carnet a').tagName).toBe('BDI');
  });

  it('lists personal books first, then the household book, with the selected one checked', async () => {
    await renderSwitcher(stores);
    await userEvent.click(trigger());
    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Carnet a', 'Carnet b', 'Carnet h']);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
  });

  it('selects a book and stays on the page', async () => {
    const { router } = await renderSwitcher(stores);
    await router.navigateByUrl('/foyer');
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Carnet h' }));
    expect(stores.books.select).toHaveBeenCalledWith('h');
    expect(router.url).toBe('/foyer');
  });

  it('ends with "Nouveau carnet", which opens the book creation', async () => {
    const { router } = await renderSwitcher(stores);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('menuitem', { name: new RegExp(t.new) }));
    expect(router.url).toBe('/carnets/nouveau');
  });

  it('disables "Nouveau carnet" with an explanation at five personal books', async () => {
    stores.books.books.set(['1', '2', '3', '4', '5'].map((id) => book(id)));
    stores.books.selectedBookId.set('1');
    await renderSwitcher(stores);
    await userEvent.click(trigger());
    const item = screen.getByRole('menuitem', { name: new RegExp(t.new) });
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.textContent).toContain(t.limit);
  });
});
