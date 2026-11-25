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

async function renderSheet(editing?: RecurringRule) {
  writeStoredTree({ tops: TREE, etag: null });
  const close = vi.fn();
  const recurring = {
    create: vi.fn<(bookId: string, input: RuleInput) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: rule('new') }),
    update: vi.fn<(bookId: string, id: string, patch: unknown) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: rule('r1') }),
  };
  const view = await render(RuleSheet, {
    providers: [
      provideTranslateService({ lang: 'fr', loader: provideTranslateLoader(FrLoader) }),
      { provide: DIALOG_DATA, useValue: { book: book('b1'), rule: editing } },
      { provide: UI_DIALOG_CONTEXT, useValue: { titleId: 't1', sheet: false, close } },
      { provide: RecurringStore, useValue: recurring },
      { provide: BooksStore, useValue: { selectedBookId: signal('b1'), load: vi.fn().mockResolvedValue({ outcome: 'done' }) } },
      { provide: SessionStore, useValue: { account: signal({ id: 'u1', name: 'Moi' }) } },
      { provide: UiConfirm, useValue: { ask: vi.fn().mockResolvedValue(true) } },
      { provide: OtherNamesApi, useValue: { list: vi.fn(() => of(['Garage'])) } },
      { provide: CategoriesApi, useValue: { tree: vi.fn(() => of<TreeAnswer>('notModified')) } },
    ],
  });
  await settle(view);
  return { ...view, close, recurring, toasts: () => TestBed.inject(UiToast).toasts() };
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

describe('RuleSheet (spec 008 REQ-6.3–6.5, 6.8)', () => {
  afterEach(() => localStorage.clear());

  it('creates a monthly rule from today, warning that past entries are made at once', async () => {
    const view = await renderSheet();
    expect(screen.getByText(fr.recurring.sheet.pastStart)).toBeTruthy();
    fill(view, /Montant/, '850');
    view.fixture.componentInstance['setCategory']('food.groceries.supermarket');
    view.detectChanges();
    save();
    await settle(view);
    expect(view.recurring.create).toHaveBeenCalledWith('b1', {
      amount: 850000,
      category: 'food.groceries.supermarket',
      otherName: null,
      comment: null,
      frequency: 'monthly',
      interval: 1,
      startsOn: today(),
      endsOn: null,
    });
    expect(view.close).toHaveBeenCalled();
  });

  it('does not warn for a start in the future', async () => {
    const view = await renderSheet();
    fill(view, /Première date/, addDays(today(), 3));
    expect(screen.queryByText(fr.recurring.sheet.pastStart)).toBeNull();
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
    view.fixture.componentInstance['setCategory']('food.groceries.supermarket');
    view.detectChanges();
    save();
    await settle(view);
    expect(view.recurring.create).not.toHaveBeenCalled();
    save();
    await settle(view);
    expect(view.recurring.create).toHaveBeenCalled();
  });

  it('refuses an end before the start', async () => {
    const view = await renderSheet();
    fill(view, /Montant/, '10');
    view.fixture.componentInstance['setCategory']('food.groceries.supermarket');
    fill(view, /Dernière date/, addDays(today(), -1));
    save();
    await settle(view);
    expect(view.recurring.create).not.toHaveBeenCalled();
    expect(screen.getByText(fr.recurring.fields.ends_on.after_or_equal)).toBeTruthy();
  });

  it('sends only the changed fields on edit, with an explanation of what changes', async () => {
    const view = await renderSheet(rule('r1', { ends_on: '2027-06-30' }));
    expect(screen.getByText(fr.recurring.sheet.editNote)).toBeTruthy();
    expect(screen.queryByText(fr.recurring.sheet.pastStart)).toBeNull();
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
    view.recurring.create.mockResolvedValueOnce(failure('validation.failed', { interval: ['interval.max'], starts_on: ['starts_on.before_or_equal'] }));
    fill(view, /Montant/, '10');
    view.fixture.componentInstance['setCategory']('food.groceries.supermarket');
    view.detectChanges();
    save();
    await settle(view);
    expect(screen.getByText(fr.recurring.fields.interval.max)).toBeTruthy();
    expect(screen.getByText(fr.recurring.fields.starts_on.before_or_equal)).toBeTruthy();
  });

  it('shows the limit of 100 rules', async () => {
    const view = await renderSheet();
    view.recurring.create.mockResolvedValueOnce(failure('recurring_rule.limit_reached'));
    fill(view, /Montant/, '10');
    view.fixture.componentInstance['setCategory']('food.groceries.supermarket');
    view.detectChanges();
    save();
    await settle(view);
    expect(screen.getByText(fr.recurring.errors.limit)).toBeTruthy();
  });

  it('closes with a toast when the rule is gone', async () => {
    const view = await renderSheet(rule('r1'));
    view.recurring.update.mockResolvedValueOnce(failure('recurring_rule.not_found'));
    fill(view, /Montant/, '900');
    save();
    await settle(view);
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain(fr.recurring.toasts.gone);
  });
});
