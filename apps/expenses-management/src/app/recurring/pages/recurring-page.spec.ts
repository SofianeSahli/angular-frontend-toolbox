import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiConfirm, UiToast } from '@shared/ui-organisms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesStore } from '../../categories/data/categories.store';
import { CategoryLabels } from '../../categories/data/category-labels';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { FAKE_LABELS } from '../../testing/render-part';
import { RecurringRule } from '../data/models';
import { RecurringStatus, RecurringStore, RuleWriteResult } from '../data/recurring.store';
import { RuleSheetService } from '../rule-sheet.service';
import { rule } from '../testing';
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
  const sheets = { openNew: vi.fn(), openEdit: vi.fn() };
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
      { provide: UiConfirm, useValue: confirm },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { ...view, store, sheets, confirm, toasts: () => TestBed.inject(UiToast).toasts() };
}

describe('RecurringPage (spec 008 REQ-6.1, 6.2, 6.6, 8.5)', () => {
  it('opens the rules of the selected book', async () => {
    const view = await renderRecurring();
    expect(view.store.open).toHaveBeenCalledWith('b1');
    expect(view.store.setActive).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('adds and edits through the rule sheet', async () => {
    const view = await renderRecurring();
    await userEvent.click(screen.getAllByRole('button', { name: /Ajouter une récurrente/ })[0]);
    expect(view.sheets.openNew).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier Garage' }));
    expect(view.sheets.openEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'r2' }));
  });

  it('deletes after a confirmation saying entries stay', async () => {
    const view = await renderRecurring();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Garage' }));
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ message: fr.recurring.delete.message }));
    expect(view.store.remove).toHaveBeenCalledWith('b1', 'r2');
    expect(view.toasts().map((t) => t.message)).toContain(fr.recurring.toasts.deleted);
  });

  it('keeps the rule when the deletion is cancelled', async () => {
    const view = await renderRecurring();
    view.confirm.ask.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Garage' }));
    expect(view.store.remove).not.toHaveBeenCalled();
  });

  it('tells when the rule was already gone', async () => {
    const view = await renderRecurring();
    view.store.remove.mockResolvedValueOnce({ outcome: 'error', error: new ApiError('not-found', 404, 'recurring_rule.not_found', {}, null, '') });
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Garage' }));
    expect(view.toasts().map((t) => t.message)).toContain(fr.recurring.toasts.gone);
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
