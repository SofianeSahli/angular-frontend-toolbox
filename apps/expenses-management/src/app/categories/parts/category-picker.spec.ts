import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { UI_DIALOG_CONTEXT } from '@shared/ui-organisms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../data/categories-api';
import { writeStoredTree } from '../data/categories-storage';
import { CategoriesStore } from '../data/categories.store';
import { LABELS, TREE } from '../testing';
import { CategoryPicker, CategoryPickerData } from './category-picker';
import { CategoryChip } from './category-chip';

async function renderPicker(data: CategoryPickerData) {
  writeStoredTree({ tops: TREE, etag: null });
  const close = vi.fn();
  const view = await render(CategoryPicker, {
    providers: [
      provideTranslateService({ lang: 'fr' }),
      {
        provide: CategoriesApi,
        useValue: { tree: () => of<TreeAnswer>('notModified') },
      },
      { provide: DIALOG_DATA, useValue: data },
      {
        provide: UI_DIALOG_CONTEXT,
        useValue: { titleId: 't1', sheet: false, close },
      },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', {
    ...fr,
    categories: { ...fr.categories, ...LABELS.categories },
  });
  await view.fixture.whenStable();
  view.detectChanges();
  return { ...view, close };
}

const item = (name: string | RegExp) => screen.getByRole('button', { name });

async function search(view: { detectChanges(): void }, text: string) {
  fireEvent.input(screen.getByRole('searchbox'), { target: { value: text } });
  await new Promise((resolve) => setTimeout(resolve, 200));
  view.detectChanges();
}

describe('CategoryPicker (REQ-3.1–3.5)', () => {
  afterEach(() => localStorage.clear());

  it('lists tops expense first, drills down to a leaf and returns its code', async () => {
    const view = await renderPicker({ mode: 'entry' });
    const tops = screen.getAllByRole('listitem').map((li) => li.textContent?.trim());
    expect(tops[0]).toContain('Alimentation');
    fireEvent.click(item(/Alimentation/));
    view.detectChanges();
    fireEvent.click(item(/Courses/));
    view.detectChanges();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('Alimentation › Courses');
    fireEvent.click(item(/Boulangerie/));
    expect(view.close).toHaveBeenCalledWith('food.groceries.bakery');
  });

  it('moves focus to the new heading and goes back one level', async () => {
    const view = await renderPicker({ mode: 'entry' });
    fireEvent.click(item(/Alimentation/));
    view.detectChanges();
    await view.fixture.whenStable();
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }));
    fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
    view.detectChanges();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(item(/Salaire/)).toBeTruthy();
  });

  it('hides retired leaves in entry mode', async () => {
    const view = await renderPicker({ mode: 'entry' });
    fireEvent.click(item(/Alimentation/));
    view.detectChanges();
    fireEvent.click(item(/Courses/));
    view.detectChanges();
    expect(screen.queryByRole('button', { name: /Ancienne/ })).toBeNull();
  });

  it('lets a group or a retired leaf be picked in filter mode', async () => {
    const view = await renderPicker({ mode: 'filter' });
    fireEvent.click(item(/Alimentation/));
    view.detectChanges();
    fireEvent.click(item(/Courses/));
    view.detectChanges();
    expect(item(/Ancienne/).textContent).toContain('Catégorie retirée');
    fireEvent.click(item('Toute la catégorie'));
    expect(view.close).toHaveBeenCalledWith('food.groceries');
  });

  it('searches without accents and shows "Groupe › Feuille"', async () => {
    const view = await renderPicker({ mode: 'entry' });
    await search(view, 'supermarche');
    fireEvent.click(item(/Courses › Supermarché/));
    expect(view.close).toHaveBeenCalledWith('food.groceries.supermarket');
  });

  it('says when nothing matches', async () => {
    const view = await renderPicker({ mode: 'entry' });
    await search(view, 'zzz');
    expect(screen.getByRole('status').textContent).toContain('Aucune catégorie ne correspond.');
  });

  it('shows offerable recents as chips, skipping retired and unknown codes', async () => {
    const view = await renderPicker({
      mode: 'entry',
      recents: ['food.groceries.old', 'nope', 'salary.pay.monthly'],
    });
    const group = screen.getByRole('group', { name: 'Récentes' });
    expect(group.querySelectorAll('button')).toHaveLength(1);
    fireEvent.click(group.querySelector('button') as HTMLButtonElement);
    expect(view.close).toHaveBeenCalledWith('salary.pay.monthly');
  });
});

describe('CategoryChip', () => {
  afterEach(() => localStorage.clear());

  it('shows the emoji and the name, or the "Other" name', async () => {
    writeStoredTree({ tops: TREE, etag: null });
    const view = await render(
      '<app-category-chip code="food.groceries.bakery" /><app-category-chip code="food.groceries.other" otherName="Épicerie" />',
      {
        imports: [CategoryChip],
        providers: [
          provideTranslateService({ lang: 'fr' }),
          {
            provide: CategoriesApi,
            useValue: { tree: () => of<TreeAnswer>('notModified') },
          },
        ],
      },
    );
    TestBed.inject(TranslateService).setTranslation('fr', LABELS);
    await TestBed.inject(CategoriesStore).load();
    view.detectChanges();
    const chips = view.container.querySelectorAll('app-category-chip');
    expect(chips[0].textContent).toContain('🏪');
    expect(chips[0].querySelector('bdi')?.textContent).toBe('Boulangerie');
    expect(chips[1].querySelector('bdi')?.textContent).toBe('Épicerie');
  });
});
