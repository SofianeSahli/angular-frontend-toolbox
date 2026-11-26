import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ApiError } from '@shared/http-data-access';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, nodeDto, renderPart, summary, visibleText } from '../../../dashboard/testing';
import { CategoriesCard } from './categories-card';

describe('CategoriesCard (spec 008 REQ-3.3, 3.7)', () => {
  it('ranks expense tops with their share and opens a category', async () => {
    await renderPart(CategoriesCard, { summary: summary(), currency: TND, month: '2026-11' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const rows = screen.getAllByRole('button');
    expect(rows.map((row) => row.textContent)).toEqual([expect.stringContaining('Nom food'), expect.stringContaining('Nom transport')]);
    expect(visibleText()).toContain('60 %');
    await userEvent.click(rows[0]);
    expect(navigate).toHaveBeenCalledWith(['/operations'], { queryParams: { mois: '2026-11', categorie: 'food' } });
  });

  it('adds a non-clickable remainder row past six categories', async () => {
    const categories = [1, 2, 3, 4, 5, 6, 7].map((n) => nodeDto(`c${n}`, n * 100));
    await renderPart(CategoriesCard, { summary: summary({ categories }), currency: TND, month: '2026-11' });
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(visibleText()).toContain('Autres catégories');
  });

  it('shows a single category as a row with its amount and no bar (REQ-9.9)', async () => {
    const categories = [nodeDto('food', 600000), nodeDto('salary', 2500000, 'income')];
    await renderPart(CategoriesCard, { summary: summary({ categories }), currency: TND, month: '2026-11' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(document.querySelector('ui-bar-list')).toBeNull();
    expect(document.querySelector('.ui-bar-list__bar')).toBeNull();
    const row = screen.getByRole('button');
    expect(row.textContent).toContain('Nom food');
    expect(row.textContent).toContain('600');
    await userEvent.click(row);
    expect(navigate).toHaveBeenCalledWith(['/operations'], { queryParams: { mois: '2026-11', categorie: 'food' } });
  });

  it('shows the empty text', async () => {
    await renderPart(CategoriesCard, { summary: summary({ categories: [] }), currency: TND, month: '2026-11' });
    expect(visibleText()).toContain('Aucune dépense ce mois-ci');
  });

  it('shows loading and error states', async () => {
    const view = await renderPart(CategoriesCard, { summary: null, currency: TND, month: '2026-11', status: 'loading' });
    expect(screen.getByRole('status')).toBeTruthy();
    view.fixture.componentRef.setInput('status', 'error');
    view.fixture.componentRef.setInput('error', new ApiError('server', 500, 'http.unknown', {}, null, ''));
    view.detectChanges();
    expect(visibleText()).toContain('Impossible de charger');
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
  });
});
