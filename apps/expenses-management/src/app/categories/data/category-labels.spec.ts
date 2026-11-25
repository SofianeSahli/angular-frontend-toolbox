import { TestBed } from '@angular/core/testing';
import { TranslateService, TranslationObject, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LABELS, TREE } from '../testing';
import { CategoriesApi, TreeAnswer } from './categories-api';
import { writeStoredTree } from './categories-storage';
import { CategoriesStore } from './categories.store';
import { CategoryLabels, normalizeForSearch } from './category-labels';

async function setup(labels: TranslationObject = LABELS) {
  writeStoredTree({ tops: TREE, etag: null });
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService({ lang: 'fr' }),
      {
        provide: CategoriesApi,
        useValue: { tree: () => of<TreeAnswer>('notModified') },
      },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', labels);
  await TestBed.inject(CategoriesStore).load();
  return TestBed.inject(CategoryLabels);
}

describe('CategoryLabels (REQ-2.4, 3.2)', () => {
  afterEach(() => localStorage.clear());

  it('names a category from its translation key', async () => {
    const labels = await setup();
    expect(labels.name('food.groceries.supermarket')).toBe('Supermarché');
    expect(labels.name('food')).toBe('Alimentation');
  });

  it("falls back to the parent's name when the key has no translation", async () => {
    const labels = await setup({
      categories: {
        unknown: 'Autre',
        food: { label: 'Alimentation', groceries: { label: 'Courses' } },
        savings: { label: 'Épargne' },
      },
    });
    expect(labels.name('food.groceries.bakery')).toBe('Courses');
    expect(labels.name('savings.account')).toBe('Épargne');
  });

  it('shows "Autre" and 📝 for a code not in the tree', async () => {
    const labels = await setup();
    expect(labels.name('travel.flights.cheap')).toBe('Autre');
    expect(labels.emoji('travel.flights.cheap')).toBe('📝');
  });

  it("uses the group's emoji for a leaf without one", async () => {
    const labels = await setup();
    expect(labels.emoji('food.groceries.bakery')).toBe('🏪');
    expect(labels.emoji('food.groceries.supermarket')).toBe('🥫');
  });

  it('gives the path "Groupe › Feuille"', async () => {
    const labels = await setup();
    expect(labels.path('food.groceries.bakery')).toBe('Courses › Boulangerie');
    expect(labels.path('food.groceries')).toBe('Alimentation › Courses');
  });

  it('searches ignoring case and accents, listing the leaves of a matching group', async () => {
    const labels = await setup();
    expect(labels.search('SUPERMARCHE', { branches: false, retired: false }).map((n) => n.code)).toEqual(['food.groceries.supermarket']);
    expect(labels.search('courses', { branches: false, retired: false }).map((n) => n.code)).toEqual([
      'food.groceries.supermarket',
      'food.groceries.bakery',
      'food.groceries.other',
    ]);
  });

  it('lists matching tops and groups and retired leaves in filter mode', async () => {
    const labels = await setup();
    const codes = labels.search('courses', { branches: true, retired: true }).map((n) => n.code);
    expect(codes[0]).toBe('food.groceries');
    expect(codes).toContain('food.groceries.old');
    expect(labels.search('epargne', { branches: true, retired: false }).map((n) => n.code)).toEqual([
      'savings',
      'savings.account',
      'savings.account.deposit',
    ]);
  });

  it('finds nothing for an empty query', async () => {
    const labels = await setup();
    expect(labels.search('  ', { branches: true, retired: true })).toEqual([]);
    expect(normalizeForSearch(' Électricité ')).toBe('electricite');
  });
});
