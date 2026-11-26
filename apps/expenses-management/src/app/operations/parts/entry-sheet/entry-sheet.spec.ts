import { DIALOG_DATA } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslationObject, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UI_DIALOG_CONTEXT, UiConfirm, UiToast } from '@shared/ui-organisms';
import { addDays, addYears, todayIn } from '@shared/util-format';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Observable, of, throwError } from 'rxjs';
import fr from '../../../../../public/i18n/fr.json';
import { CategoriesApi, TreeAnswer } from '../../../categories/data/categories-api';
import { writeStoredTree } from '../../../categories/data/categories-storage';
import { pushRecentCategory, readRecentCategories } from '../../../categories/data/recent-categories';
import { LABELS, TREE } from '../../../categories/testing';
import { BooksStore } from '../../../households/data/books.store';
import { book } from '../../../households/testing';
import { Entry, EntryInput } from '../../data/models';
import { OperationsStore, WriteResult } from '../../data/operations.store';
import { OtherNamesApi } from '../../data/other-names-api';
import { EntryHistory } from '../../data/entry-history';
import { RecurringStore, RuleWriteResult } from '../../../recurring/data/recurring.store';
import { entry } from '../../testing';
import { EntrySheet } from './entry-sheet';

const B1 = book('b1');

// Validators translate their message when the form is built, so translations must exist before render.
class FrLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of({ ...fr, categories: { ...fr.categories, ...LABELS.categories } });
  }
}
const failure = (code: string, status = 422, fields: Record<string, string[]> = {}, retry: number | null = null): WriteResult => ({
  outcome: 'error',
  error: new ApiError(status === 422 ? 'validation' : 'conflict', status, code, fields, retry, 'r1'),
});
const done = (saved: Entry | null = entry('x')): WriteResult => ({
  outcome: 'done',
  entry: saved,
});

async function renderSheet(
  options: {
    editing?: Entry;
    mode?: 'once' | 'recurring';
    history?: readonly Entry[] | null;
    otherNames?: () => Observable<readonly string[]>;
  } = {},
) {
  writeStoredTree({ tops: TREE, etag: null });
  pushRecentCategory('u1', 'b1', 'food.groceries.other');
  pushRecentCategory('u1', 'b1', 'food.groceries.supermarket');
  const close = vi.fn();
  const operations = {
    create: vi.fn<(bookId: string, input: EntryInput) => Promise<WriteResult>>().mockResolvedValue(done()),
    update: vi.fn<(bookId: string, id: string, patch: unknown) => Promise<WriteResult>>().mockResolvedValue(done()),
    remove: vi.fn<(bookId: string, id: string) => Promise<WriteResult>>().mockResolvedValue(done(null)),
  };
  const selectedBookId = signal<string | null>('b1');
  const books = {
    selectedBookId,
    load: vi.fn().mockResolvedValue({ outcome: 'done' }),
  };
  const confirm = {
    ask: vi.fn<(o: unknown) => Promise<boolean>>().mockResolvedValue(true),
  };
  const otherNames = {
    list: vi.fn(options.otherNames ?? (() => of(['Épicerie du coin', 'Marché']))),
  };
  const categoriesApi = { tree: vi.fn(() => of<TreeAnswer>('notModified')) };
  const history = {
    forBook: options.history === null ? vi.fn().mockRejectedValue(new Error('offline')) : vi.fn().mockResolvedValue(options.history ?? []),
    invalidate: vi.fn(),
  };
  const recurring = { create: vi.fn<(bookId: string, input: unknown) => Promise<RuleWriteResult>>().mockResolvedValue({ outcome: 'done', rule: null }) };
  const view = await render(EntrySheet, {
    providers: [
      provideTranslateService({ lang: 'fr', loader: provideTranslateLoader(FrLoader) }),
      { provide: DIALOG_DATA, useValue: { book: B1, entry: options.editing, mode: options.mode } },
      {
        provide: UI_DIALOG_CONTEXT,
        useValue: { titleId: 't1', sheet: false, close },
      },
      { provide: OperationsStore, useValue: operations },
      { provide: BooksStore, useValue: books },
      {
        provide: SessionStore,
        useValue: { account: signal({ id: 'u1', name: 'Moi' }) },
      },
      { provide: UiConfirm, useValue: confirm },
      { provide: OtherNamesApi, useValue: otherNames },
      { provide: CategoriesApi, useValue: categoriesApi },
      { provide: EntryHistory, useValue: history },
      { provide: RecurringStore, useValue: recurring },
    ],
  });
  await settle(view);
  return {
    ...view,
    close,
    operations,
    books,
    selectedBookId,
    confirm,
    otherNames,
    categoriesApi,
    history,
    recurring,
    toasts: () => TestBed.inject(UiToast).toasts(),
  };
}

async function settle(view: { detectChanges(): void }) {
  await new Promise((resolve) => setTimeout(resolve));
  view.detectChanges();
}

const amountInput = () => screen.getByLabelText(/Montant/) as HTMLInputElement;
const saveButton = () => document.querySelector('button[type="submit"]') as HTMLButtonElement;

function typeAmount(view: { detectChanges(): void }, text: string) {
  fireEvent.input(amountInput(), { target: { value: text } });
  fireEvent.blur(amountInput());
  view.detectChanges();
}

function pickRecent(view: { detectChanges(): void }, name: RegExp) {
  const recents = screen.getByRole('group', { name: 'Catégorie' });
  const chip = [...recents.querySelectorAll('button')].find((b) => name.test(b.textContent ?? ''));
  fireEvent.click(chip as HTMLButtonElement);
  view.detectChanges();
}

async function save(view: { detectChanges(): void }) {
  fireEvent.click(saveButton());
  await settle(view);
}

describe('EntrySheet add mode (REQ-4.2–4.10, 7.1–7.8)', () => {
  afterEach(() => localStorage.clear());

  it('previews the amount in the book currency and explains an invalid value', async () => {
    const view = await renderSheet();
    expect(amountInput().getAttribute('inputmode')).toBe('decimal');
    typeAmount(view, '1500');
    expect(view.container.querySelector('[aria-live="polite"]')?.textContent?.replace(/[\u202f\u00a0]/g, ' ')).toContain('1 500,000 DT');
    typeAmount(view, '1,2345');
    expect(view.container.textContent).toContain('Trop de décimales pour cette devise');
  });

  it('keeps the save button disabled until an amount is typed, then shows it (spec 009 REQ-3.2, 3.8)', async () => {
    const view = await renderSheet();
    fireEvent.focus(amountInput());
    fireEvent.blur(amountInput());
    view.detectChanges();
    expect(amountInput().getAttribute('aria-invalid')).toBeNull();
    expect(saveButton().disabled).toBe(true);
    expect(saveButton().textContent).toContain('Saisissez un montant');
    typeAmount(view, '12,5');
    expect(saveButton().disabled).toBe(false);
    expect(saveButton().textContent?.replace(/[\u202f\u00a0]/g, ' ')).toContain('Ajouter 12,500 DT');
  });

  it('asks to confirm an amount at or above 1 000, then saves on the second press', async () => {
    const view = await renderSheet();
    typeAmount(view, '1500');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.operations.create).not.toHaveBeenCalled();
    expect(saveButton().textContent).toContain('Confirmer');
    await save(view);
    expect(view.operations.create).toHaveBeenCalledTimes(1);
    expect(view.operations.create.mock.calls[0][1]).toMatchObject({
      amount: 1500000,
      category: 'food.groceries.supermarket',
      date: todayIn('Africa/Tunis'),
    });
  });

  it('clears the warning when the amount changes', async () => {
    const view = await renderSheet();
    typeAmount(view, '1500');
    pickRecent(view, /Supermarché/);
    await save(view);
    typeAmount(view, '12');
    expect(saveButton().textContent).toContain('Ajouter');
  });

  it('closes, toasts by type and updates the recents after a save', async () => {
    const view = await renderSheet();
    typeAmount(view, '12,5');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain('Dépense enregistrée');
    expect(readRecentCategories('u1', 'b1')[0]).toBe('food.groceries.supermarket');
  });

  it('keeps the same id when retrying after going offline', async () => {
    const view = await renderSheet();
    view.operations.create.mockResolvedValueOnce(failure('http.offline', 0));
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.container.textContent).toContain("Échec de l'enregistrement, vérifiez la connexion");
    expect(view.close).not.toHaveBeenCalled();
    await save(view);
    const [first, second] = view.operations.create.mock.calls.map((call) => call[1].id);
    expect(second).toBe(first);
  });

  it('makes a new id and retries once after a 409', async () => {
    const view = await renderSheet();
    view.operations.create.mockResolvedValueOnce(failure('transaction.id_conflict', 409));
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    const ids = view.operations.create.mock.calls.map((call) => call[1].id);
    expect(ids).toHaveLength(2);
    expect(ids[1]).not.toBe(ids[0]);
    expect(view.close).toHaveBeenCalled();
  });

  it('shows a generic error after a second 409', async () => {
    const view = await renderSheet();
    view.operations.create.mockResolvedValue(failure('transaction.id_conflict', 409));
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.container.textContent).toContain("L'enregistrement a échoué. Réessayez.");
  });

  it('requires and suggests a name on an "Other" leaf', async () => {
    const view = await renderSheet();
    pickRecent(view, /Autre/);
    await settle(view);
    expect(view.otherNames.list).toHaveBeenCalledWith('b1', 'food.groceries.other');
    fireEvent.click(screen.getByRole('button', { name: 'Marché' }));
    view.detectChanges();
    expect((screen.getByLabelText(/Précisez/) as HTMLInputElement).value).toBe('Marché');
  });

  it('shows no suggestion and no error when the suggestions call fails', async () => {
    const view = await renderSheet({
      otherNames: () => throwError(() => new Error('offline')),
    });
    pickRecent(view, /Autre/);
    await settle(view);
    expect(screen.queryByRole('group', { name: 'Suggestions' })).toBeNull();
  });

  it('sets the date with the chips, and another date in the collapsed field, within the limits (spec 009 REQ-3.7)', async () => {
    const view = await renderSheet();
    const today = todayIn('Africa/Tunis');
    expect(view.container.querySelector('input[type="date"]')).toBeNull();
    expect(screen.queryByLabelText(/Commentaire/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Note' }));
    view.detectChanges();
    expect(screen.getByLabelText(/Commentaire/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Autre date' }));
    view.detectChanges();
    const input = view.container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.value).toBe(today);
    expect(input.min).toBe('2000-01-01');
    expect(input.max).toBe(addYears(today, 1));
    fireEvent.click(screen.getByRole('button', { name: 'Hier' }));
    view.detectChanges();
    expect(screen.getByRole('button', { name: 'Hier' }).getAttribute('aria-pressed')).toBe('true');
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.operations.create.mock.calls[0][1].date).toBe(addDays(today, -1));
  });

  it('puts field codes on their fields and drops a refused category', async () => {
    const view = await renderSheet();
    view.operations.create.mockResolvedValueOnce(
      failure('validation.failed', 422, {
        comment: ['comment.max'],
        category: ['category.retired'],
      }),
    );
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.container.textContent).toContain('200 caractères au maximum');
    expect(view.container.textContent).toContain('Cette catégorie a été retirée');
    expect(view.categoriesApi.tree).toHaveBeenCalledTimes(2);
    expect(view.container.querySelector('app-category-chip')).toBeNull();
  });

  it('shows the throttle delay above the button', async () => {
    const view = await renderSheet();
    view.operations.create.mockResolvedValueOnce(failure('request.throttled', 429, {}, 30));
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(screen.getByRole('status').textContent).toContain('Réessayez dans 30 s');
  });

  it('closes and reloads the workspace when the book is gone', async () => {
    const view = await renderSheet();
    view.operations.create.mockResolvedValueOnce(failure('book.not_found', 404));
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.close).toHaveBeenCalled();
    expect(view.books.load).toHaveBeenCalledWith({ force: true });
    expect(view.toasts().map((t) => t.message)).toContain("Ce carnet n'est plus accessible");
  });

  it('ignores a second submit while saving', async () => {
    const view = await renderSheet();
    let finish: (value: WriteResult) => void = () => undefined;
    view.operations.create.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    typeAmount(view, '12');
    pickRecent(view, /Supermarché/);
    fireEvent.click(saveButton());
    fireEvent.click(saveButton());
    finish(done());
    await settle(view);
    expect(view.operations.create).toHaveBeenCalledTimes(1);
  });

  it('asks before discarding typed data', async () => {
    const view = await renderSheet();
    view.confirm.ask.mockResolvedValueOnce(false);
    typeAmount(view, '12');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await settle(view);
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Abandonner la saisie ?' }));
    expect(view.close).not.toHaveBeenCalled();
  });

  it('closes without saving when the selected book changes', async () => {
    const view = await renderSheet();
    view.selectedBookId.set('b2');
    await settle(view);
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain('Carnet changé, saisie abandonnée');
  });
});

describe('EntrySheet edit mode (REQ-6.1–6.5, 7.4)', () => {
  afterEach(() => localStorage.clear());

  const saved = () =>
    entry('e1', {
      amount: 12500,
      comment: 'hebdo',
      created_by: { id: 'u1', name: 'Moi' },
      updated_by: { id: 'u2', name: 'Sami' },
    });

  it('prefills the form and shows who created and edited the entry', async () => {
    const view = await renderSheet({ editing: saved() });
    expect(amountInput().value).toBe('12,500');
    expect(view.container.textContent).toContain('Ajoutée par Moi');
    expect(view.container.textContent).toContain('modifiée par Sami');
  });

  it('shows a retired leaf with its badge', async () => {
    const view = await renderSheet({
      editing: entry('e1', { category: 'food.groceries.old' }),
    });
    expect(view.container.textContent).toContain('Catégorie retirée');
  });

  it('closes without a call when nothing changed', async () => {
    const view = await renderSheet({ editing: saved() });
    await save(view);
    expect(view.operations.update).not.toHaveBeenCalled();
    expect(view.close).toHaveBeenCalled();
  });

  it('patches only the changed fields', async () => {
    const view = await renderSheet({ editing: saved() });
    typeAmount(view, '13,25');
    fireEvent.input(screen.getByLabelText(/Commentaire/), {
      target: { value: '' },
    });
    view.detectChanges();
    await save(view);
    expect(view.operations.update).toHaveBeenCalledWith('b1', 'e1', {
      amount: 13250,
      comment: null,
    });
  });

  it('deletes after a destructive confirmation', async () => {
    const view = await renderSheet({ editing: saved() });
    fireEvent.click(screen.getByRole('button', { name: /Supprimer l'opération/ }));
    await settle(view);
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }));
    expect(view.operations.remove).toHaveBeenCalledWith('b1', 'e1');
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain('Opération supprimée');
  });

  it('closes with a toast when the entry is gone', async () => {
    const view = await renderSheet({ editing: saved() });
    view.operations.update.mockResolvedValueOnce(failure('transaction.not_found', 404));
    typeAmount(view, '13');
    await save(view);
    expect(view.close).toHaveBeenCalled();
    expect(view.toasts().map((t) => t.message)).toContain('Cette opération a été supprimée');
  });

  it('shows the recurring badge in the header of an entry made by a rule (spec 008 REQ-6.7)', async () => {
    await renderSheet({ editing: entry('e1', { recurring_rule_id: 'r1' }) });
    expect(screen.getByText('récurrent')).toBeTruthy();
  });
});

describe('EntrySheet quick add (spec 009 REQ-3.1–3.6, 4.1–4.3)', () => {
  afterEach(() => localStorage.clear());

  const now = new Date().toISOString();

  it('opens in one-off mode with a radio switch, or in recurring mode when asked', async () => {
    await renderSheet();
    const once = screen.getByRole('radio', { name: 'Une seule fois' });
    expect(once.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radiogroup', { name: 'Type de saisie' })).toBeTruthy();
  });

  it('pre-selects the suggested category from the history and marks it', async () => {
    const view = await renderSheet({ history: [entry('h1', { category: 'food.groceries.supermarket', created_at: now })] });
    await settle(view);
    const chip = screen.getByRole('button', { description: 'suggérée' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(view.history.forBook).toHaveBeenCalledWith('u1', expect.objectContaining({ id: 'b1' }));
  });

  it('fills the amount and the category from a template without saving', async () => {
    const view = await renderSheet({ history: [entry('h1', { category: 'food.groceries.supermarket', amount: 1500, created_at: now })] });
    await settle(view);
    const templates = screen.getByRole('group', { name: 'Reprendre une opération récente' });
    fireEvent.click(templates.querySelector('button') as HTMLButtonElement);
    view.detectChanges();
    expect(amountInput().value).toBe('1,500');
    expect(view.operations.create).not.toHaveBeenCalled();
  });

  it('opens at once and adds nothing when the history fails', async () => {
    const view = await renderSheet({ history: null });
    await settle(view);
    expect(amountInput()).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Reprendre une opération récente' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('creates a recurring rule in recurring mode, keeping the typed values when switching', async () => {
    const view = await renderSheet();
    typeAmount(view, '650');
    pickRecent(view, /Supermarché/);
    fireEvent.click(screen.getByRole('radio', { name: 'Récurrente' }));
    view.detectChanges();
    expect(screen.getByRole('heading', { name: 'Nouvelle opération récurrente' })).toBeTruthy();
    expect(amountInput().value).toBe('650');
    expect(saveButton().textContent).toContain('chaque mois');
    await save(view);
    expect(view.operations.create).not.toHaveBeenCalled();
    expect(view.recurring.create).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ amount: 650000, category: 'food.groceries.supermarket', frequency: 'monthly', interval: 1, startsOn: todayIn('Africa/Tunis') }),
    );
    expect(view.close).toHaveBeenCalled();
    expect(view.history.invalidate).toHaveBeenCalledWith('u1', 'b1');
  });

  it('shows the rule limit and keeps the sheet open', async () => {
    const view = await renderSheet({ mode: 'recurring' });
    view.recurring.create.mockResolvedValueOnce({ outcome: 'error', error: new ApiError('validation', 422, 'recurring_rule.limit_reached', {}, null, 'r1') });
    typeAmount(view, '45');
    pickRecent(view, /Supermarché/);
    await save(view);
    expect(view.close).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain(fr.recurring.errors.limit);
  });
});
