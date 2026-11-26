import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { UI_DIALOG_CONTEXT } from '@shared/ui-organisms';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../data/categories-api';
import { writeStoredTree } from '../data/categories-storage';
import { CategoriesStore } from '../data/categories.store';
import { Top } from '../data/models';
import { LABELS, TREE } from '../testing';
import { CategoryPicker, CategoryPickerData } from './category-picker/category-picker';
import { CategoryChip } from './category-chip/category-chip';

async function renderPicker(data: CategoryPickerData, tops: readonly Top[] = TREE) {
  writeStoredTree({ tops, etag: null });
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
const panelOf = (toggle: HTMLElement) => document.getElementById(toggle.getAttribute('aria-controls') ?? '') as HTMLElement;

function expand(view: { detectChanges(): void }, toggle: HTMLElement) {
  fireEvent.click(toggle);
  view.detectChanges();
}

async function search(view: { detectChanges(): void }, text: string) {
  fireEvent.input(screen.getByRole('searchbox'), { target: { value: text } });
  await new Promise((resolve) => setTimeout(resolve, 200));
  view.detectChanges();
}

describe('CategoryPicker (REQ-3.1–3.5)', () => {
  afterEach(() => localStorage.clear());

  it('lists tops expense first, expands them in place and picks a leaf', async () => {
    const view = await renderPicker({ mode: 'entry' });
    const tops = screen.getAllByRole('listitem').map((li) => li.textContent?.trim());
    expect(tops[0]).toContain('Alimentation');
    const food = item(/^Alimentation/);
    expect(food.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /^Courses/ })).toBeNull();
    expand(view, food);
    expect(food.getAttribute('aria-expanded')).toBe('true');
    expect(panelOf(food).hasAttribute('inert')).toBe(false);
    expect(item(/^Salaire/)).toBeTruthy();
    expand(view, item(/^Courses/));
    fireEvent.click(item(/^Boulangerie/));
    expect(view.close).toHaveBeenCalledWith('food.groceries.bakery');
  });

  it('keeps a single top open and its panel hidden from assistive tech once closed', async () => {
    const view = await renderPicker({ mode: 'entry' });
    expand(view, item(/^Alimentation/));
    expand(view, item(/^Salaire/));
    expect(item(/^Alimentation/).getAttribute('aria-expanded')).toBe('false');
    expect(panelOf(item(/^Alimentation/)).getAttribute('aria-hidden')).toBe('true');
    expect(panelOf(item(/^Alimentation/)).hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('button', { name: /^Courses/ })).toBeNull();
    expect(item(/^Salaire/).getAttribute('aria-expanded')).toBe('true');
    expect(item(/^Paie/)).toBeTruthy();
    expand(view, item(/^Salaire/));
    expect(item(/^Salaire/).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /^Paie/ })).toBeNull();
  });

  it('keeps focus on the toggled header and closes the open group with its top', async () => {
    const view = await renderPicker({ mode: 'entry' });
    const food = item(/^Alimentation/);
    await userEvent.click(food);
    view.detectChanges();
    expect(document.activeElement).toBe(food);
    expand(view, item(/^Courses/));
    expect(item(/^Courses/).getAttribute('aria-expanded')).toBe('true');
    expand(view, food);
    expand(view, food);
    expect(item(/^Courses/).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /^Boulangerie/ })).toBeNull();
  });

  it('hides retired leaves in entry mode', async () => {
    const view = await renderPicker({ mode: 'entry' });
    expand(view, item(/^Alimentation/));
    expand(view, item(/^Courses/));
    expect(screen.queryByRole('button', { name: /Ancienne/ })).toBeNull();
  });

  it('starts each open branch with an "All of" row in filter mode', async () => {
    const view = await renderPicker({ mode: 'filter' });
    const food = item(/^Alimentation/);
    expand(view, food);
    expect(within(panelOf(food)).getAllByRole('button')[0].textContent).toContain('Tout dans Alimentation');
    expand(view, item(/^Courses/));
    expect(within(panelOf(item(/^Courses/))).getAllByRole('button')[0].textContent).toContain('Tout dans Courses');
    expect(item(/Ancienne/).textContent).toContain('Catégorie retirée');
    fireEvent.click(item('Tout dans Courses'));
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

  describe('plan mode (spec 008 REQ-5.3)', () => {
    it('offers expense tops and groups only, never leaves, income or saving', async () => {
      const view = await renderPicker({ mode: 'plan' });
      expect(screen.getByRole('heading').textContent).toContain('Ajouter une ligne');
      expect(screen.queryByRole('button', { name: /^Salaire/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /^Épargne/ })).toBeNull();
      const food = item(/^Alimentation/);
      expand(view, food);
      const buttons = within(panelOf(food)).getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toContain('Tout dans Alimentation');
      expect(buttons[1].textContent).toContain('Courses');
      expect(screen.queryByRole('button', { name: /Supermarché/ })).toBeNull();
      fireEvent.click(item(/^Courses/));
      expect(view.close).toHaveBeenCalledWith('food.groceries');
    });

    it('picks a whole top', async () => {
      const view = await renderPicker({ mode: 'plan' });
      expand(view, item(/^Alimentation/));
      fireEvent.click(item('Tout dans Alimentation'));
      expect(view.close).toHaveBeenCalledWith('food');
    });

    it('hides categories overlapping a line of the draft', async () => {
      await renderPicker({ mode: 'plan', excluded: ['food.groceries'] });
      expect(screen.queryByRole('button', { name: /^Alimentation/ })).toBeNull();
      expect(screen.getByRole('status').textContent).toContain('Toutes les catégories');
    });

    it('hides the groups of a planned top', async () => {
      await renderPicker({ mode: 'plan', excluded: ['food'] });
      expect(screen.queryByRole('button', { name: /^Alimentation/ })).toBeNull();
    });

    it('hides retired groups and tops', async () => {
      const tops = TREE.map((top) => (top.code === 'food' ? { ...top, groups: top.groups.map((group) => ({ ...group, retired: true })) } : top));
      const view = await renderPicker({ mode: 'plan' }, tops);
      const food = item(/^Alimentation/);
      expand(view, food);
      const buttons = within(panelOf(food)).getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0].textContent).toContain('Tout dans Alimentation');
    });

    it('searches tops and groups only', async () => {
      const view = await renderPicker({ mode: 'plan' });
      await search(view, 'cour');
      expect(screen.getAllByRole('button').some((button) => button.textContent?.includes('Courses'))).toBe(true);
      expect(screen.queryByRole('button', { name: /Supermarché/ })).toBeNull();
    });
  });
});
