import { DIALOG_DATA } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslationObject, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UI_DIALOG_CONTEXT, UiConfirm, UiToast } from '@shared/ui-organisms';
import { addDays, todayIn } from '@shared/util-format';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Observable, of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../../categories/data/categories-api';
import { writeStoredTree } from '../../categories/data/categories-storage';
import { LABELS, TREE } from '../../categories/testing';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { OtherNamesApi } from '../../operations/data/other-names-api';
import { RecurringRule, RuleInput } from '../data/models';
import { RecurringStore, RuleWriteResult } from '../data/recurring.store';
import { rule } from '../testing';
import { RuleSheet } from './rule-sheet';

class FrLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of({ ...fr, categories: { ...fr.categories, ...LABELS.categories } });
  }
}

const failure = (code: string, fields: Record<string, string[]> = {}): RuleWriteResult => ({
  outcome: 'error',
  error: new ApiError('validation', 422, code, fields, null, 'r1'),
});

async function renderSheet(editing: RecurringRule = rule('r1')) {
  writeStoredTree({ tops: TREE, etag: null });
  const close = vi.fn();
  const recurring = {
    create: vi.fn<(bookId: string, input: RuleInput) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: rule('new') }),
    update: vi.fn<(bookId: string, id: string, patch: unknown) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: rule('r1') }),
    remove: vi.fn<(bookId: string, id: string) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: null }),
  };
  const confirm = { ask: vi.fn().mockResolvedValue(true) };
  const view = await render(RuleSheet, {
    providers: [
      provideTranslateService({ lang: 'fr', loader: provideTranslateLoader(FrLoader) }),
      { provide: DIALOG_DATA, useValue: { book: book('b1'), rule: editing } },
      { provide: UI_DIALOG_CONTEXT, useValue: { titleId: 't1', sheet: false, close } },
      { provide: RecurringStore, useValue: recurring },
      { provide: BooksStore, useValue: { selectedBookId: signal('b1'), load: vi.fn().mockResolvedValue({ outcome: 'done' }) } },
      { provide: SessionStore, useValue: { account: signal({ id: 'u1', name: 'Moi' }) } },
      { provide: UiConfirm, useValue: confirm },
      { provide: OtherNamesApi, useValue: { list: vi.fn(() => of(['Garage'])) } },
      { provide: CategoriesApi, useValue: { tree: vi.fn(() => of<TreeAnswer>('notModified')) } },
    ],
  });
  await settle(view);
  return { ...view, close, recurring, confirm, toasts: () => TestBed.inject(UiToast).toasts() };
}

async function settle(view: { detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  view.detectChanges();
}

const input = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;
const save = () => screen.getByRole('button', { name: /Enregistrer|Confirmer/ }).click();
const today = () => todayIn('Africa/Tunis');

function fill(view: { detectChanges(): void }, label: RegExp, value: string) {
  fireEvent.input(input(label), { target: { value } });
  view.detectChanges();
}

describe('RuleSheet, edit only (spec 008 REQ-6.4, 6.5, 6.8; spec 009 REQ-10.4)', () => {
  afterEach(() => localStorage.clear());

  it('offers no creation: the title is the edit title and the next date is shown', async () => {
    await renderSheet(rule('r1', { next_date: '2026-12-01' }));
    expect(screen.getByRole('heading', { name: fr.recurring.sheet.editTitle })).toBeTruthy();
    expect(screen.getByText(/Prochaine/)).toBeTruthy();
  });

  it('asks the Other name and shows suggestions on an Other leaf', async () => {
    const view = await renderSheet();
    view.fixture.componentInstance['setCategory']('food.groceries.other');
    view.detectChanges();
    await settle(view);
    expect(screen.getByLabelText(/Précisez/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Garage' })).toBeTruthy();
  });

  it('confirms a big amount before saving', async () => {
    const view = await renderSheet();
    fill(view, /Montant/, '5000');
    save();
    await settle(view);
    expect(view.recurring.update).not.toHaveBeenCalled();
    save();
    await settle(view);
    expect(view.recurring.update).toHaveBeenCalledWith('b1', 'r1', { amount: 5000000 });
  });

  it('refuses an end before the start', async () => {
    const view = await renderSheet(rule('r1', { starts_on: today() }));
    fill(view, /Dernière date/, addDays(today(), -1));
    save();
    await settle(view);
    expect(view.recurring.update).not.toHaveBeenCalled();
    expect(screen.getByText(fr.recurring.fields.ends_on.after_or_equal)).toBeTruthy();
  });

  it('sends only the changed fields, with an explanation of what changes', async () => {
    const view = await renderSheet(rule('r1', { ends_on: '2027-06-30' }));
    expect(view.container.textContent).toContain(fr.recurring.sheet.editNote);
    fill(view, /Dernière date/, '');
    save();
    await settle(view);
    expect(view.recurring.update).toHaveBeenCalledWith('b1', 'r1', { endsOn: null });
  });

  it('keeps a retired category of an existing rule', async () => {
    const view = await renderSheet(rule('r1', { category: 'food.groceries.old' }));
    expect(screen.getByText(fr.categories.picker.retired)).toBeTruthy();
    fill(view, /Montant/, '900');
    save();
    await settle(view);
    expect(view.recurring.update).toHaveBeenCalledWith('b1', 'r1', { amount: 900000 });
  });

  it('shows field codes on their fields', async () => {
    const view = await renderSheet();
    view.recurring.update.mockResolvedValueOnce(failure('validation.failed', { interval: ['interval.max'], starts_on: ['starts_on.before_or_equal'] }));
    fill(view, /Montant/, '10');
    save();
    await settle(view);
    expect(screen.getByText(fr.recurring.fields.interval.max)).toBeTruthy();
    expect(screen.getByText(fr.recurring.fields.starts_on.before_or_equal)).toBeTruthy();
  });

  it('closes with a toast when the rule is gone', async () => {
    const view = await renderSheet();
    view.recurring.update.mockResolvedValueOnce(failure('recurring_rule.not_found'));
    fill(view, /Montant/, '900');
    save();
    await settle(view);
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain(fr.recurring.toasts.gone);
  });

  it('stops the rule after a confirmation saying the entries stay (spec 009 REQ-10.4)', async () => {
    const view = await renderSheet();
    screen.getByRole('button', { name: fr.recurring.sheet.stop }).click();
    await settle(view);
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ message: fr.recurring.delete.message, tone: 'danger' }));
    expect(view.recurring.remove).toHaveBeenCalledWith('b1', 'r1');
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain(fr.recurring.toasts.deleted);
  });

  it('keeps the rule when stopping is cancelled', async () => {
    const view = await renderSheet();
    view.confirm.ask.mockResolvedValueOnce(false);
    screen.getByRole('button', { name: fr.recurring.sheet.stop }).click();
    await settle(view);
    expect(view.recurring.remove).not.toHaveBeenCalled();
  });
});
