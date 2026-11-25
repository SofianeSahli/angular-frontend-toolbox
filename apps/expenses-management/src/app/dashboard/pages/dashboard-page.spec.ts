import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { todayIn } from '@shared/util-format';
import fr from '../../../../public/i18n/fr.json';
import { Budget } from '../../budget/data/models';
import { NO_PLAN, budget } from '../../budget/testing';
import { CategoriesStore } from '../../categories/data/categories.store';
import { CategoryLabels } from '../../categories/data/category-labels';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { EntrySheetService } from '../../operations/entry-sheet.service';
import { Card, CardName, Comparison, DashboardStore, FirstUse } from '../data/dashboard.store';
import { Summary } from '../data/models';
import { FAKE_LABELS, summary } from '../testing';
import { DashboardPage } from './dashboard-page';

const ready = <T>(data: T): Card<T> => ({ status: 'ready', data, error: null });

function fakeStore() {
  const month = signal<string | null>(null);
  const bookId = signal<string | null>(null);
  return {
    bookId,
    month,
    budget: signal<Card<Budget>>(ready(budget())),
    summary: signal<Card<Summary>>(ready(summary())),
    comparison: signal<Card<Comparison>>({ status: 'idle', data: null, error: null }),
    previous: signal<Card<Summary>>(ready(summary())),
    trend: signal<Card<Summary>>(ready(summary())),
    upcoming: signal<Card<readonly never[]>>(ready([])),
    recent: signal<Card<readonly never[]>>(ready([])),
    firstUse: signal<FirstUse>('no'),
    open: vi.fn((id: string, value: string) => {
      bookId.set(id);
      month.set(value);
    }),
    reload: vi.fn<(card: CardName) => Promise<void>>().mockResolvedValue(undefined),
    setActive: vi.fn(),
  };
}

async function renderDashboard(url = '/', owner: 'account' | 'household' | null = 'account') {
  const store = fakeStore();
  const sheets = { openNew: vi.fn(), openEdit: vi.fn() };
  const current = owner === null ? null : book('b1', owner);
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([{ path: '', component: DashboardPage }]),
      provideTranslateService({ lang: 'fr' }),
      { provide: DashboardStore, useValue: store },
      { provide: BooksStore, useValue: { selectedBook: signal(current), selectedBookId: signal(current === null ? null : 'b1') } },
      { provide: CategoriesStore, useValue: { load: vi.fn().mockResolvedValue({ outcome: 'done' }) } },
      { provide: CategoryLabels, useValue: FAKE_LABELS },
      { provide: EntrySheetService, useValue: sheets },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  view.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  view.detectChanges();
  return { ...view, store, sheets, router };
}

const thisMonth = () => todayIn('Africa/Tunis').slice(0, 7);

describe('DashboardPage (spec 008 REQ-1.1–1.4, 3.8, 4.4, 8.9)', () => {
  it('opens the month of the query', async () => {
    const { store } = await renderDashboard('/?mois=2026-10');
    expect(store.open).toHaveBeenCalledWith('b1', '2026-10');
    expect(store.setActive).toHaveBeenCalledWith(true);
  });

  it('defaults to the current month in the book timezone', async () => {
    const { store } = await renderDashboard('/?mois=n-importe');
    expect(store.open).toHaveBeenCalledWith('b1', thisMonth());
  });

  it('shows the hero and the watch list when the month has a plan', async () => {
    await renderDashboard('/?mois=2026-11');
    expect(screen.getByRole('heading', { name: 'Reste à dépenser' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'À surveiller' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Dépensé ce mois' })).toBeNull();
  });

  it('hides the remainder and the watch list without a plan', async () => {
    const view = await renderDashboard('/?mois=2026-11');
    view.store.budget.set(ready(NO_PLAN));
    view.detectChanges();
    expect(screen.queryByRole('heading', { name: 'Reste à dépenser' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'À surveiller' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Dépensé ce mois' })).toBeTruthy();
  });

  it('gives each card a heading and shows members only for a household', async () => {
    await renderDashboard('/', 'account');
    expect(screen.queryByRole('heading', { name: 'Par membre' })).toBeNull();
    for (const name of ["Où va l'argent", 'À venir', 'Récent']) expect(screen.getByRole('heading', { name })).toBeTruthy();
  });

  it('shows members for a household', async () => {
    await renderDashboard('/', 'household');
    expect(screen.getByRole('heading', { name: 'Par membre' })).toBeTruthy();
  });

  it('places the pace card after the hero and the trend card after the members (REQ-9.7, 9.8)', async () => {
    await renderDashboard('/?mois=2026-11', 'household');
    const order = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent?.trim());
    expect(order.indexOf('Rythme du mois')).toBe(order.indexOf('Reste à dépenser') + 2);
    expect(order.indexOf('Rythme du mois')).toBeLessThan(order.indexOf("Où va l'argent"));
    expect(order.indexOf('6 derniers mois')).toBeGreaterThan(order.indexOf('Par membre'));
    expect(order.indexOf('6 derniers mois')).toBeLessThan(order.indexOf('À venir'));
  });

  it('reloads only the failing chart card on retry', async () => {
    const view = await renderDashboard('/?mois=2026-11');
    view.store.trend.set({ status: 'error', data: null, error: null });
    view.detectChanges();
    screen.getByRole('button', { name: 'Réessayer' }).click();
    expect(view.store.reload).toHaveBeenCalledWith('trend');
    expect(screen.getByRole('heading', { name: 'Reste à dépenser' })).toBeTruthy();
  });

  it('shows skeleton cards instead of a blank page while there is no book (REQ-9.10)', async () => {
    await renderDashboard('/', null);
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('heading', { name: 'Reste à dépenser' })).toBeTruthy();
  });

  it('replaces every card by the first-use card for a book never used', async () => {
    const view = await renderDashboard('/');
    view.store.firstUse.set('yes');
    view.detectChanges();
    expect(screen.getByRole('heading', { name: 'Bienvenue dans votre carnet' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Récent' })).toBeNull();
    screen.getByRole('button', { name: /Ajouter une opération/ }).click();
    expect(view.sheets.openNew).toHaveBeenCalled();
  });

  it('writes a new month in the URL, replacing the history entry', async () => {
    const view = await renderDashboard('/?mois=2026-10');
    const navigate = vi.spyOn(view.router, 'navigate');
    screen.getByRole('button', { name: /suivant/i }).click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { mois: '2026-11' }, replaceUrl: true }));
  });

  it('follows the store when it falls back to another month', async () => {
    const view = await renderDashboard('/?mois=2026-10');
    view.store.month.set('2026-11');
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    expect(view.router.url).toBe('/?mois=2026-11');
  });
});
