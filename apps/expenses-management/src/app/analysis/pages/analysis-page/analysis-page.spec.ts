import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import fr from '../../../../../public/i18n/fr.json';
import { Budget } from '../../../budget/data/models';
import { budget } from '../../../budget/testing';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { Card } from '../../../dashboard/data/card';
import { Summary } from '../../../dashboard/data/models';
import { FAKE_LABELS, summary } from '../../../dashboard/testing';
import { BooksStore } from '../../../households/data/books.store';
import { book } from '../../../households/testing';
import { AnalysisCardName, AnalysisStore, FixedCard } from '../../data/analysis.store';
import { AnalysisPage } from './analysis-page';

const ready = <T>(data: T): Card<T> => ({ status: 'ready', data, error: null });

async function renderAnalysis(owner: 'account' | 'household') {
  const store = {
    bookId: signal<string | null>(null),
    month: signal<string | null>(null),
    budget: signal<Card<Budget>>(ready(budget())),
    summary: signal<Card<Summary>>(ready(summary())),
    previous: signal<Card<Summary>>(ready(summary())),
    trend: signal<Card<Summary>>(ready(summary())),
    fixed: signal<Card<FixedCard>>({ status: 'loading', data: null, error: null }),
    open: vi.fn(),
    reload: vi.fn<(card: AnalysisCardName) => Promise<void>>().mockResolvedValue(undefined),
    setActive: vi.fn(),
  };
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([{ path: 'analyse', component: AnalysisPage }]),
      provideTranslateService({ lang: 'fr' }),
      { provide: AnalysisStore, useValue: store },
      { provide: BooksStore, useValue: { selectedBook: signal(book('b1', owner)) } },
      { provide: CategoriesStore, useValue: { load: vi.fn().mockResolvedValue({ outcome: 'done' }) } },
      { provide: CategoryLabels, useValue: FAKE_LABELS },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  await TestBed.inject(Router).navigateByUrl('/analyse?mois=2026-10');
  view.detectChanges();
  return { view, store };
}

describe('AnalysisPage (spec 009 REQ-6.1, 6.3)', () => {
  it('opens the month of the query and shows the four cards in order for a household', async () => {
    const { store } = await renderAnalysis('household');
    expect(store.open).toHaveBeenCalledWith('b1', '2026-10');
    const order = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent?.trim());
    expect(order).toEqual(['Rythme du mois', "Où va l'argent", '6 derniers mois', 'Qui a ajouté quoi']);
  });

  it('leaves the members out of a personal book', async () => {
    await renderAnalysis('account');
    expect(screen.queryByRole('heading', { name: 'Qui a ajouté quoi' })).toBeNull();
  });
});
