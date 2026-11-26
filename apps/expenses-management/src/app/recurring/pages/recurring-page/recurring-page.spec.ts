import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiConfirm, UiToast } from '@shared/ui-organisms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../../public/i18n/fr.json';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { BooksStore } from '../../../households/data/books.store';
import { book } from '../../../households/testing';
import { FAKE_LABELS } from '../../../testing/render-part';
import { RecurringRule } from '../../data/models';
import { RecurringStatus, RecurringStore, RuleWriteResult } from '../../data/recurring.store';
import { RuleSheetService } from '../../rule-sheet.service';
import { EntrySheetService } from '../../../operations/entry-sheet.service';
import { rule } from '../../testing';
import { RecurringPage } from './recurring-page';

async function renderRecurring(rules: RecurringRule[] = [rule('r1'), rule('r2', { other_name: 'Garage' })]) {
  const store = {
    rules: signal<readonly RecurringRule[]>(rules),
    status: signal<RecurringStatus>('ready'),
    error: signal<ApiError | null>(null),
    open: vi.fn().mockResolvedValue({ outcome: 'done' }),
    reload: vi.fn().mockResolvedValue({ outcome: 'done' }),
    remove: vi.fn<(bookId: string, id: string) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: null }),
    setActive: vi.fn(),
  };
  const sheets = { openEdit: vi.fn() };
  const entrySheets = { openNew: vi.fn() };
  const confirm = { ask: vi.fn<(options: unknown) => Promise<boolean>>().mockResolvedValue(true) };
  const view = await render(RecurringPage, {
    providers: [
      provideRouter([]),
      provideTranslateService({ lang: 'fr' }),
      { provide: RecurringStore, useValue: store },
      { provide: BooksStore, useValue: { selectedBook: signal(book('b1')), selectedBookId: signal('b1') } },
      { provide: CategoriesStore, useValue: { load: vi.fn().mockResolvedValue({ outcome: 'done' }) } },
      { provide: CategoryLabels, useValue: FAKE_LABELS },
      { provide: RuleSheetService, useValue: sheets },
      { provide: EntrySheetService, useValue: entrySheets },
      { provide: UiConfirm, useValue: confirm },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { ...view, store, sheets, entrySheets, confirm, toasts: () => TestBed.inject(UiToast).toasts() };
}

describe('RecurringPage (spec 008 REQ-6.1, 6.2, 6.6, 8.5)', () => {
  it('opens the rules of the selected book', async () => {
    const view = await renderRecurring();
    expect(view.store.open).toHaveBeenCalledWith('b1');
    expect(view.store.setActive).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('adds through the add sheet in recurring mode and edits through the rule sheet (spec 009 REQ-10.1, 10.4)', async () => {
    const view = await renderRecurring();
    await userEvent.click(screen.getAllByRole('button', { name: new RegExp(fr.recurring.add) })[0]);
    expect(view.entrySheets.openNew).toHaveBeenCalledWith({ mode: 'recurring' });
    await userEvent.click(screen.getAllByRole('button', { name: /Loyer/ })[0]);
    expect(view.sheets.openEdit).toHaveBeenCalled();
  });

  it('shows the monthly average of live rules, expenses and income apart (spec 009 REQ-10.1)', async () => {
    const view = await renderRecurring([rule('r1', { amount: 650000 }), rule('r2', { amount: 2800000, type: 'income' })]);
    const text = (view.container.textContent ?? '').replace(/[\u202f\u00a0]/g, ' ');
    expect(text).toContain('650,000');
    expect(text).toContain('2 800,000');
  });

  it('lists live rules by type and keeps ended ones collapsed (spec 009 REQ-10.2)', async () => {
    await renderRecurring([rule('r1'), rule('r2', { type: 'income', comment: 'Salaire' }), rule('r3', { comment: 'Ancien', next_date: null })]);
    expect(screen.getByRole('heading', { name: fr.recurring.sections.expense })).toBeTruthy();
    expect(screen.getByRole('heading', { name: fr.recurring.sections.income })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: fr.recurring.sections.saving })).toBeNull();
    expect(screen.queryByRole('button', { name: /Ancien/ })).toBeNull();
    const toggle = screen.getByRole('button', { name: /Terminées \(1\)/ });
    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Ancien/ })).toBeTruthy();
  });

  it('shows an empty state', async () => {
    await renderRecurring([]);
    expect(screen.getByRole('heading', { name: fr.recurring.empty.title })).toBeTruthy();
  });

  it('shows the offline error with a retry', async () => {
    const view = await renderRecurring();
    view.store.status.set('error');
    view.store.error.set(new ApiError('offline', 0, 'http.offline', {}, null, ''));
    view.detectChanges();
    expect(screen.getByText(fr.recurring.loadOffline)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(view.store.reload).toHaveBeenCalled();
  });
});
