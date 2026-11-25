import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { UiDialog } from '@shared/ui-organisms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../../categories/data/categories-api';
import { EntryFilters } from '../data/models';
import { NOVEMBER } from '../testing';
import { OperationsFilters } from './operations-filters';

async function renderFilters(filters: EntryFilters) {
  const changed = vi.fn();
  const clear = vi.fn();
  const dialog = { open: vi.fn(() => ({ closed: of('food.groceries') })) };
  const view = await render(OperationsFilters, {
    inputs: {
      filters,
      authors: [
        { id: 'u1', name: 'Moi' },
        { id: 'u2', name: 'Sami' },
      ],
    },
    on: { changed, clear },
    providers: [
      provideTranslateService({ lang: 'fr' }),
      { provide: UiDialog, useValue: dialog },
      {
        provide: CategoriesApi,
        useValue: { tree: () => of<TreeAnswer>('notModified') },
      },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { ...view, changed, clear, dialog };
}

describe('OperationsFilters (REQ-5.4)', () => {
  it('emits the next month as a from/to range', async () => {
    const view = await renderFilters(NOVEMBER);
    const next = view.container.querySelectorAll('ui-month-switcher button');
    fireEvent.click(next[next.length - 1]);
    expect(view.changed).toHaveBeenCalledWith({
      from: '2026-12-01',
      to: '2026-12-31',
    });
  });

  it('emits the chosen type, and null for "Tout"', async () => {
    const view = await renderFilters({ ...NOVEMBER, type: 'expense' });
    fireEvent.click(screen.getByRole('radio', { name: 'Revenus' }));
    expect(view.changed).toHaveBeenLastCalledWith({ type: 'income' });
    fireEvent.click(screen.getByRole('radio', { name: 'Tout' }));
    expect(view.changed).toHaveBeenLastCalledWith({ type: null });
  });

  it('opens the picker in filter mode and emits the code', async () => {
    const view = await renderFilters(NOVEMBER);
    fireEvent.click(screen.getByRole('button', { name: 'Catégorie' }));
    await view.fixture.whenStable();
    expect(view.dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { mode: 'filter' } }));
    expect(view.changed).toHaveBeenCalledWith({ category: 'food.groceries' });
  });

  it('shows the category as a removable chip', async () => {
    const view = await renderFilters({ ...NOVEMBER, category: 'food' });
    fireEvent.click(screen.getByRole('button', { name: /Retirer le filtre/ }));
    expect(view.changed).toHaveBeenCalledWith({ category: null });
  });

  it('hides "Effacer les filtres" when no filter narrows the list', async () => {
    await renderFilters(NOVEMBER);
    expect(screen.queryByRole('button', { name: 'Effacer les filtres' })).toBeNull();
  });

  it('offers "Effacer les filtres" when a filter narrows the list', async () => {
    const narrowed = await renderFilters({ ...NOVEMBER, author: 'u2' });
    fireEvent.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(narrowed.clear).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Sami/ })).toBeTruthy();
  });
});
