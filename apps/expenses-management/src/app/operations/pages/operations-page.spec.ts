import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
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
import { SummaryApi } from '../../dashboard/data/summary-api';
import { summary } from '../../dashboard/testing';

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
    loadAll: vi.fn().mockResolvedValue(DONE),
  };
}

async function renderPage(options: { household?: boolean; url?: string } = {}) {
  const stores = fakeStores();
  const selected = book('b1', options.household ? 'household' : 'account');
  stores.books.books.set([selected]);
  stores.books.selectedBookId.set('b1');
  stores.household.members.set([member('u1', 'owner'), member('u2')]);
  const operations = fakeOperations();
  const sheets = { openNew: vi.fn(), openEdit: vi.fn() };
  const summaries = { get: vi.fn(() => of(summary())) };
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([
        { path: 'operations', component: OperationsPage },
        { path: '**', children: [] },
      ]),
      provideTranslateService({ lang: 'fr' }),
      { provide: BooksStore, useValue: stores.books },
      { provide: HouseholdStore, useValue: stores.household },
      { provide: SessionStore, useValue: stores.session },
      { provide: OperationsStore, useValue: operations },
      { provide: EntrySheetService, useValue: sheets },
      { provide: SummaryApi, useValue: summaries },
      {
        provide: CategoriesApi,
        useValue: { tree: () => of<TreeAnswer>('notModified') },
      },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  await TestBed.inject(Router).navigateByUrl(options.url ?? '/operations');
  view.detectChanges();
  return { ...view, operations, sheets, stores, summaries };
}

describe('OperationsPage (REQ-5.1–5.7, 5.9)', () => {
  it('has one h1, opens the selected book and marks itself active', async () => {
    const view = await renderPage();
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent?.trim())).toEqual(['Opérations']);
    expect(view.operations.open).toHaveBeenCalledWith('b1', null);
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

  describe('drill-down (spec 008 REQ-1.3, 6.9)', () => {
    it('opens with the month and the category of the query', async () => {
      const view = await renderPage({ url: '/operations?mois=2026-10&categorie=food' });
      expect(view.operations.open).toHaveBeenCalledWith('b1', { from: '2026-10-01', to: '2026-10-31', category: 'food' });
    });

    it('opens with the month alone', async () => {
      const view = await renderPage({ url: '/operations?mois=2026-02' });
      expect(view.operations.open).toHaveBeenCalledWith('b1', { from: '2026-02-01', to: '2026-02-28' });
    });

    it('no longer links to the recurring operations, now a tab (spec 009 REQ-1.6)', async () => {
      await renderPage();
      expect(screen.queryByRole('link', { name: /Récurrentes/ })).toBeNull();
    });
  });

  describe('spec 009 (REQ-7.1–7.3)', () => {
    const SEARCH_DEBOUNCE_MS = 250;
    async function typeSearch(view: { detectChanges(): void }, search: HTMLElement, value: string): Promise<void> {
      fireEvent.input(search, { target: { value } });
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 10));
      view.detectChanges();
    }

    it('shows the month totals under the month', async () => {
      const view = await renderPage();
      await new Promise((resolve) => setTimeout(resolve));
      view.detectChanges();
      expect(view.summaries.get).toHaveBeenCalledWith('b1', { month: '2026-11' }, expect.anything());
      expect(view.container.querySelector('ui-month-switcher')?.textContent?.replace(/[\u202f\u00a0]/g, ' ')).toContain('+2 500,000 DT');
    });

    it('follows every page and filters the rows while searching', async () => {
      const view = await renderPage();
      view.operations.entries.set([entry('e1', { comment: 'Boulangerie', date: '2026-11-02' }), entry('e2', { comment: 'Taxi', date: '2026-11-02' })]);
      view.detectChanges();
      const search = screen.getByRole('searchbox', { name: 'Rechercher une opération' }) as HTMLInputElement;
      await typeSearch(view, search, 'boulang');
      expect(view.operations.loadAll).toHaveBeenCalledWith(20);
      expect(view.container.querySelectorAll('app-entry-row')).toHaveLength(1);
      await typeSearch(view, search, 'zzz');
      expect(view.container.textContent).toContain('Aucune opération ne correspond');
    });

    it('says the search covers only the loaded rows when the cap is reached', async () => {
      const view = await renderPage();
      view.operations.nextCursor.set('c21');
      await typeSearch(view, screen.getByRole('searchbox', { name: 'Rechercher une opération' }), 'x');
      expect(screen.getByRole('status').textContent).toContain('chargées');
    });

    it('totals each day once all its rows are loaded', async () => {
      const view = await renderPage();
      view.operations.entries.set([entry('e1', { date: '2026-11-03', amount: 12000 }), entry('e2', { date: '2026-11-02', amount: 3500 })]);
      view.operations.nextCursor.set('c2');
      view.detectChanges();
      expect(view.container.querySelectorAll('.ui-grouped-list__total')).toHaveLength(1);
    });
  });
});
