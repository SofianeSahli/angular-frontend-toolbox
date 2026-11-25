import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import fr from '../../../public/i18n/fr.json';
import { BooksStore } from '../households/data/books.store';
import { FakeStores, book, fakeStores } from '../households/testing';
import { BookHome } from './book-home';

async function renderHome(stores: FakeStores) {
  const view = await render(BookHome, {
    providers: [provideTranslateService({ lang: 'fr' }), { provide: BooksStore, useValue: stores.books }],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return view;
}

describe('BookHome', () => {
  let stores: FakeStores;

  beforeEach(() => {
    stores = fakeStores();
    stores.books.books.set([book('a'), { ...book('b'), currency: { code: 'EUR', exponent: 2 }, timezone: 'Europe/Paris' }]);
    stores.books.selectedBookId.set('a');
  });

  it('shows the selected book name, currency code, timezone and the dashboard note', async () => {
    await renderHome(stores);
    expect(screen.getByRole('heading', { level: 1 }).textContent?.trim()).toBe(fr.home.title);
    expect(screen.getByText('Carnet a').tagName).toBe('BDI');
    expect(screen.getByText('TND')).toBeTruthy();
    expect(screen.getByText('Africa/Tunis')).toBeTruthy();
    expect(screen.getByText(fr.home.soon)).toBeTruthy();
  });

  it('shows the new book when the selection changes', async () => {
    const view = await renderHome(stores);
    stores.books.selectedBookId.set('b');
    view.detectChanges();
    expect(screen.getByText('Carnet b')).toBeTruthy();
    expect(screen.getByText('EUR')).toBeTruthy();
    expect(screen.getByText('Europe/Paris')).toBeTruthy();
  });

  it('shows no amount', async () => {
    const view = await renderHome(stores);
    expect(view.container.querySelector('ui-amount')).toBeNull();
  });
});
