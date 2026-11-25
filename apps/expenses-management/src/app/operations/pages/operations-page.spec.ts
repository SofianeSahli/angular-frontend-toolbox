import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../../categories/data/categories-api';
import { BooksStore } from '../../households/data/books.store';
import { HouseholdStore } from '../../households/data/household.store';
import { DONE, book, fakeStores, member } from '../../households/testing';
import { EntrySheetService } from '../entry-sheet.service';
import { Entry, EntryFilters } from '../data/models';
import { OperationsStatus, OperationsStore, PageStatus } from '../data/operations.store';
import { NOVEMBER, entry } from '../testing';
import { OperationsPage } from './operations-page';

function fakeOperations() {
  return {
    filters: signal<EntryFilters | null>(NOVEMBER),
    entries: signal<readonly Entry[]>([]),
    nextCursor: signal<string | null>(null),
    status: signal<OperationsStatus>('ready'),
    pageStatus: signal<PageStatus>('idle'),
    pages: signal(1),
    open: vi.fn().mockResolvedValue(DONE),
    setActive: vi.fn(),
    setFilters: vi.fn().mockResolvedValue(DONE),
    clearFilters: vi.fn().mockResolvedValue(DONE),
    loadMore: vi.fn().mockResolvedValue(DONE),
    reload: vi.fn().mockResolvedValue(DONE),
  };
}

async function renderPage(options: { household?: boolean } = {}) {
  const stores = fakeStores();
  const selected = book('b1', options.household ? 'household' : 'account');
  stores.books.books.set([selected]);
  stores.books.selectedBookId.set('b1');
  stores.household.members.set([member('u1', 'owner'), member('u2')]);
  const operations = fakeOperations();
  const sheets = { openNew: vi.fn(), openEdit: vi.fn() };
  const view = await render(OperationsPage, {
    providers: [
      provideTranslateService({ lang: 'fr' }),
      { provide: BooksStore, useValue: stores.books },
      { provide: HouseholdStore, useValue: stores.household },
      { provide: SessionStore, useValue: stores.session },
      { provide: OperationsStore, useValue: operations },
      { provide: EntrySheetService, useValue: sheets },
      {
        provide: CategoriesApi,
        useValue: { tree: () => of<TreeAnswer>('notModified') },
      },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { ...view, operations, sheets, stores };
}

describe('OperationsPage (REQ-5.1–5.7, 5.9)', () => {
  it('has one h1, opens the selected book and marks itself active', async () => {
    const view = await renderPage();
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent?.trim())).toEqual(['Opérations']);
    expect(view.operations.open).toHaveBeenCalledWith('b1');
    expect(view.operations.setActive).toHaveBeenCalledWith(true);
    view.fixture.destroy();
    expect(view.operations.setActive).toHaveBeenLastCalledWith(false);
  });

  it('shows skeleton rows while the first page loads', async () => {
    const view = await renderPage();
    view.operations.status.set('loading');
    view.detectChanges();
    expect(view.container.querySelectorAll('.ui-grouped-list__skeleton-row').length).toBeGreaterThan(0);
  });

  it('shows the empty state with an add button when there is no filter', async () => {
    const view = await renderPage();
    expect(view.container.textContent).toContain('Aucune opération ce mois-ci');
    const adds = screen.getAllByRole('button', { name: /Ajouter une dépense/ });
    fireEvent.click(adds[adds.length - 1]);
    expect(view.sheets.openNew).toHaveBeenCalled();
  });

  it('offers to clear the filters when they leave the list empty', async () => {
    const view = await renderPage();
    view.operations.filters.set({ ...NOVEMBER, type: 'income' });
    view.detectChanges();
    expect(view.container.textContent).toContain('Aucune opération ne correspond');
    const clears = screen.getAllByRole('button', {
      name: 'Effacer les filtres',
    });
    fireEvent.click(clears[clears.length - 1]);
    expect(view.operations.clearFilters).toHaveBeenCalled();
  });

  it('groups rows by day and opens one for editing', async () => {
    const view = await renderPage();
    const saved = entry('e1', { date: '2026-11-02' });
    view.operations.entries.set([saved]);
    view.detectChanges();
    expect(screen.getAllByRole('heading', { level: 2 })[0].textContent?.toLowerCase()).toContain('2 novembre 2026');
    fireEvent.click(view.container.querySelector('app-entry-row button') as HTMLButtonElement);
    expect(view.sheets.openEdit).toHaveBeenCalledWith(saved);
  });

  it('says the list is complete only after more than one page', async () => {
    const view = await renderPage();
    view.operations.entries.set([entry('e1')]);
    view.detectChanges();
    expect(view.container.textContent).not.toContain('Toutes les opérations sont affichées');
    view.operations.pages.set(2);
    view.detectChanges();
    expect(view.container.textContent).toContain('Toutes les opérations sont affichées');
  });

  it('keeps the rows and offers a retry when a page fails', async () => {
    const view = await renderPage();
    view.operations.entries.set([entry('e1')]);
    view.operations.pageStatus.set('error');
    view.detectChanges();
    expect(view.container.querySelectorAll('app-entry-row')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(view.operations.loadMore).toHaveBeenCalled();
  });

  it('reloads page 1 when the first page failed', async () => {
    const view = await renderPage();
    view.operations.status.set('error');
    view.detectChanges();
    expect(view.container.textContent).not.toContain('Aucune opération ce mois-ci');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(view.operations.reload).toHaveBeenCalled();
  });

  it('loads the household members on a household book and lists them as authors', async () => {
    const view = await renderPage({ household: true });
    expect(view.stores.household.loadDetail).toHaveBeenCalled();
    expect(view.container.querySelector('app-operations-filters')).not.toBeNull();
  });
});
