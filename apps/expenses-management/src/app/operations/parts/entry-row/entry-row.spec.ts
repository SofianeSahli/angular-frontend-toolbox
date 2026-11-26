import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import fr from '../../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../../../categories/data/categories-api';
import { writeStoredTree } from '../../../categories/data/categories-storage';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { LABELS, TREE } from '../../../categories/testing';
import { Entry } from '../../data/models';
import { entry } from '../../testing';
import { EntryRow } from './entry-row';

const TND = { code: 'TND', exponent: 3 };
const SPACES = /[\u202f\u00a0]/g;

async function renderRow(row: Entry, showAuthor = false) {
  writeStoredTree({ tops: TREE, etag: null });
  const open = vi.fn();
  const view = await render(EntryRow, {
    inputs: { entry: row, currency: TND, showAuthor },
    on: { open },
    providers: [
      provideTranslateService({ lang: 'fr' }),
      {
        provide: CategoriesApi,
        useValue: { tree: () => of<TreeAnswer>('notModified') },
      },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', {
    ...fr,
    categories: { ...fr.categories, ...LABELS.categories },
  });
  await TestBed.inject(CategoriesStore).load();
  view.detectChanges();
  return { ...view, open };
}

describe('EntryRow (REQ-5.3, 8.2, 8.4)', () => {
  afterEach(() => localStorage.clear());

  it('shows emoji, leaf name, comment and amount, with an accessible name', async () => {
    const view = await renderRow(entry('e1', { comment: 'hebdo', amount: 48350, date: '2026-11-02' }));
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('🥫');
    expect(button.querySelector('bdi')?.textContent).toBe('Supermarché');
    expect(button.textContent).toContain('hebdo');
    expect(button.getAttribute('aria-label')?.replace(SPACES, ' ')).toMatch(/^Supermarché, 48,350 DT, lundi 2 novembre 2026$/i);
    fireEvent.click(button);
    expect(view.open).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });

  it('names an "Other" entry by its typed name', async () => {
    await renderRow(
      entry('e1', {
        category: 'food.groceries.other',
        other_name: 'Épicerie du coin',
      }),
    );
    expect(screen.getByRole('button').querySelector('bdi')?.textContent).toBe('Épicerie du coin');
  });

  it('uses the income tone for income', async () => {
    const income = await renderRow(entry('e1', { type: 'income', category: 'salary.pay.monthly' }));
    expect(income.container.querySelector('ui-amount')?.classList).toContain('ui-amount--income');
  });

  it('never uses the income tone or a danger colour for a saving', async () => {
    const saving = await renderRow(entry('e2', { type: 'saving', category: 'savings.account.deposit' }));
    expect(saving.container.querySelector('ui-amount')?.classList).not.toContain('ui-amount--income');
  });

  it('hides the author on a personal book', async () => {
    const own = await renderRow(entry('e1', { created_by: { id: 'u2', name: 'Sami' } }));
    expect(own.container.textContent).not.toContain('par Sami');
  });

  it('shows the author on a household book', async () => {
    const shared = await renderRow(entry('e1', { created_by: { id: 'u2', name: 'Sami' } }), true);
    expect(shared.container.textContent).toContain('par Sami');
  });

  it('marks an entry made by a recurring rule (spec 008 REQ-6.7)', async () => {
    await renderRow(entry('e1', { recurring_rule_id: 'r1' }));
    expect(screen.getByText('récurrent')).toBeTruthy();
    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/, récurrent$/);
  });

  it('shows no badge on an entry typed by hand', async () => {
    await renderRow(entry('e1'));
    expect(screen.queryByText('récurrent')).toBeNull();
  });
});
