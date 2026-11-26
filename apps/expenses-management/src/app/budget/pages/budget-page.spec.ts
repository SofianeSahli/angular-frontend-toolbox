import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiConfirm, UiDialog, UiToast } from '@shared/ui-organisms';
import { render, screen, within } from '@testing-library/angular';
import { Observable, of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesStore } from '../../categories/data/categories.store';
import { CategoryLabels } from '../../categories/data/category-labels';
import { TREE } from '../../categories/testing';
import { Summary } from '../../dashboard/data/models';
import { nodeDto, summary } from '../../dashboard/testing';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { RecurringApi } from '../../recurring/data/recurring-api';
import { rule } from '../../recurring/testing';
import { FAKE_LABELS } from '../../testing/render-part';
import { BudgetPlans } from '../data/budget-plans';
import { BudgetBusy, BudgetStatus, BudgetStore, BudgetWriteResult } from '../data/budget.store';
import { Budget, BudgetInput } from '../data/models';
import { AmountSheet, AmountSheetResult } from '../parts/amount-sheet';
import { NO_PLAN, budget, lineDto } from '../testing';
import { budgetLeaveGuard } from './budget-leave.guard';
import { BudgetPage } from './budget-page';

const failure = (code: string, status: number, fields: Record<string, string[]> = {}) =>
  new ApiError(status === 409 ? 'conflict' : status === 0 ? 'offline' : 'validation', status, code, fields, null, 'r1');

function fakeStore(initial: Budget) {
  const bookId = signal<string | null>(null);
  const month = signal<string | null>(null);
  return {
    summary: signal<Summary | null>(null),
    previous: signal<Summary | null>(null),
    bookId,
    month,
    budget: signal<Budget | null>(initial),
    status: signal<BudgetStatus>('ready'),
    error: signal<ApiError | null>(null),
    busy: signal<BudgetBusy>('idle'),
    open: vi.fn(async (id: string, value: string) => {
      bookId.set(id);
      month.set(value);
      return { outcome: 'done' as const };
    }),
    reload: vi.fn().mockResolvedValue({ outcome: 'done' }),
    save: vi.fn<(input: BudgetInput) => Promise<BudgetWriteResult>>(async () => ({ outcome: 'done', budget: initial })),
    copy: vi.fn<(replace: boolean) => Promise<BudgetWriteResult>>(async () => ({ outcome: 'done', budget: budget() })),
    setActive: vi.fn(),
  };
}

async function renderBudget(initial: Budget = budget(), url = '/budget?mois=2026-11') {
  const store = fakeStore(initial);
  const confirm = { ask: vi.fn<(options: unknown) => Promise<boolean>>().mockResolvedValue(true) };
  const answers: { next: AmountSheetResult | undefined } = { next: { kind: 'set', text: '650' } };
  const dialog = {
    open: vi.fn((component: unknown): { closed: Observable<unknown> } => ({ closed: of(component === AmountSheet ? answers.next : 'health') })),
  };
  const plans = { plans: signal<Record<string, boolean>>({ '2026-12': true, '2027-01': false }), load: vi.fn(), set: vi.fn() };
  const recurringApi = { list: vi.fn(() => of([rule('rent', { comment: 'Loyer', starts_on: '2026-10-01' })])) };
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([{ path: 'budget', component: BudgetPage, canDeactivate: [budgetLeaveGuard] }, { path: '**', children: [] }]),
      provideTranslateService({ lang: 'fr' }),
      { provide: BudgetStore, useValue: store },
      { provide: BooksStore, useValue: { selectedBook: signal(book('b1')), selectedBookId: signal('b1') } },
      { provide: CategoriesStore, useValue: { load: vi.fn().mockResolvedValue({ outcome: 'done' }), orderedTops: signal(TREE), node: () => null } },
      { provide: CategoryLabels, useValue: FAKE_LABELS },
      { provide: UiConfirm, useValue: confirm },
      { provide: UiDialog, useValue: dialog },
      { provide: BudgetPlans, useValue: plans },
      { provide: RecurringApi, useValue: recurringApi },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  view.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  view.detectChanges();
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    view.detectChanges();
  };
  return { ...view, store, confirm, dialog, router, settle, answers, plans, recurringApi, toasts: () => TestBed.inject(UiToast).toasts() };
}

const strip = () => screen.getByRole('navigation', { name: fr.budget.strip.label });
const lineButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^Nom ${name},`) });

async function editFirstLine(view: Awaited<ReturnType<typeof renderBudget>>) {
  lineButton('food').click();
  await view.settle();
}

describe('BudgetPage (spec 008 REQ-5.1, 5.6–5.9; spec 009 REQ-9.1–9.7)', () => {
  it('opens the month of the query and shows the overview, income, saving and lines', async () => {
    const { store } = await renderBudget();
    expect(store.open).toHaveBeenCalledWith('b1', '2026-11');
    expect(screen.getByRole('heading', { name: "Vue d'ensemble" })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Revenu prévu/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Nom .*, prévu/ })).toHaveLength(4);
    expect(screen.getByText('Hors budget')).toBeTruthy();
  });

  it('shows a month strip with the selected month and the known statuses', async () => {
    const view = await renderBudget();
    const months = within(strip()).getAllByRole('button');
    const selected = months.find((month) => month.getAttribute('aria-current') === 'date');
    expect(selected).toBeTruthy();
    expect(view.plans.load).toHaveBeenCalledWith('b1', expect.arrayContaining([expect.stringMatching(/^\d{4}-\d{2}$/)]));
    expect(strip().textContent).toContain(fr.budget.strip.closed);
  });

  it('edits a line in a sheet and shows the save bar with the number of changes', async () => {
    const view = await renderBudget();
    expect(screen.queryByRole('button', { name: fr.budget.saveBar.discard })).toBeNull();
    await editFirstLine(view);
    expect(view.dialog.open).toHaveBeenCalledWith(AmountSheet, expect.objectContaining({ data: expect.objectContaining({ text: '600,000', removable: true }) }));
    expect(screen.getByRole('status').textContent).toContain('1 modification');
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(view.store.save.mock.calls[0][0].lines[0]).toEqual({ category: 'food', planned: 650000 });
    expect(view.toasts().map((t) => t.message)).toContain(fr.budget.saved);
  });

  it('removes a line from its sheet and restores everything with "Annuler"', async () => {
    const view = await renderBudget();
    view.answers.next = { kind: 'remove' };
    await editFirstLine(view);
    expect(screen.getAllByRole('button', { name: /^Nom .*, prévu/ })).toHaveLength(3);
    screen.getByRole('button', { name: fr.budget.saveBar.discard }).click();
    view.detectChanges();
    expect(screen.getAllByRole('button', { name: /^Nom .*, prévu/ })).toHaveLength(4);
    expect(screen.queryByRole('button', { name: fr.budget.saveBar.discard })).toBeNull();
  });

  it('keeps a refused draft and shows the codes on their lines', async () => {
    const view = await renderBudget();
    view.store.save.mockResolvedValueOnce({ outcome: 'error', error: failure('validation.failed', 422, { 'lines.2.planned': ['lines.planned.max'], lines: ['lines.max'] }) });
    await editFirstLine(view);
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(screen.getByText(fr.budget.fields.lines.planned.max)).toBeTruthy();
    expect(screen.getByText(fr.budget.fields.lines.max)).toBeTruthy();
  });

  it('shows the offline message and keeps the draft', async () => {
    const view = await renderBudget();
    view.store.save.mockResolvedValueOnce({ outcome: 'error', error: failure('http.offline', 0) });
    await editFirstLine(view);
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(screen.getByText(fr.budget.errors.offline)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('1 modification');
  });

  it('confirms before clearing an existing plan', async () => {
    const view = await renderBudget(budget({ lines: [lineDto('food')], income: { expected: null, actual: 0 }, saving: { planned: null, actual: 0 } }));
    view.answers.next = { kind: 'remove' };
    view.confirm.ask.mockResolvedValueOnce(false);
    await editFirstLine(view);
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.clear.title }));
    expect(view.store.save).not.toHaveBeenCalled();
  });

  it('offers to copy the previous month or start from zero for a month without a plan (REQ-9.6)', async () => {
    const view = await renderBudget(NO_PLAN);
    expect(screen.queryByRole('heading', { name: "Vue d'ensemble" })).toBeNull();
    screen.getByRole('button', { name: /^Copier/ }).click();
    await view.settle();
    expect(view.confirm.ask).not.toHaveBeenCalled();
    expect(view.store.copy).toHaveBeenCalledWith(false);
  });

  it('shows the empty plan form after "Partir de zéro"', async () => {
    const view = await renderBudget(NO_PLAN);
    screen.getByRole('button', { name: fr.budget.empty.fresh }).click();
    view.detectChanges();
    expect(screen.getByRole('heading', { name: fr.budget.lines.title })).toBeTruthy();
  });

  it('confirms the replacement of an existing plan', async () => {
    const view = await renderBudget();
    screen.getByRole('button', { name: /^Copier le budget/ }).click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.copy.replaceTitle }));
    expect(view.store.copy).toHaveBeenCalledWith(true);
  });

  it('says when the previous month has no budget', async () => {
    const view = await renderBudget(NO_PLAN);
    view.store.copy.mockResolvedValueOnce({ outcome: 'error', error: failure('budget.nothing_to_copy', 409) });
    screen.getByRole('button', { name: /^Copier/ }).click();
    await view.settle();
    expect(screen.getByText(fr.budget.copy.nothing)).toBeTruthy();
  });

  it('adds a line through the picker in plan mode, excluding the lines of the draft', async () => {
    const view = await renderBudget();
    screen.getByRole('button', { name: /Ajouter une ligne/ }).click();
    await view.settle();
    const config = (view.dialog.open.mock.calls[0] as unknown[])[1] as { data: { mode: string; excluded: string[] } };
    expect(config.data.mode).toBe('plan');
    expect(config.data.excluded).toEqual(['food', 'home.housing', 'transport', 'entertainment.outings']);
    expect(screen.getAllByRole('button', { name: /^Nom .*, prévu/ })).toHaveLength(5);
  });

  it('lists the unplanned categories and adds one to the draft (spec 008 REQ-9.13)', async () => {
    const view = await renderBudget();
    view.store.summary.set(summary({ categories: [nodeDto('food', 600000), nodeDto('health', 9000)] }));
    view.detectChanges();
    screen.getByRole('button', { name: 'Voir le détail' }).click();
    view.detectChanges();
    screen.getByRole('button', { name: 'Ajouter Nom health au budget' }).click();
    view.detectChanges();
    expect(screen.getAllByRole('button', { name: /^Nom .*, prévu/ })).toHaveLength(5);
  });

  it('asks before leaving or changing month with unsaved changes', async () => {
    const view = await renderBudget();
    await editFirstLine(view);
    view.confirm.ask.mockResolvedValueOnce(false);
    const months = within(strip()).getAllByRole('button');
    const next = months[months.findIndex((month) => month.getAttribute('aria-current') === 'date') + 1];
    next.click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.leave.title }));
    expect(view.router.url).toBe('/budget?mois=2026-11');
    view.confirm.ask.mockResolvedValueOnce(false);
    expect(await view.router.navigateByUrl('/ailleurs')).toBe(false);
  });

  it('shows the rules already known for a future month (REQ-9.7)', async () => {
    const view = await renderBudget(NO_PLAN, '/budget?mois=2027-01');
    expect(view.recurringApi.list).toHaveBeenCalledWith('b1', expect.anything());
    expect(screen.getByRole('heading', { name: /Déjà connu pour/ })).toBeTruthy();
    expect(view.container.textContent).toContain('Loyer');
  });

  it('shows the load error with a retry', async () => {
    const view = await renderBudget();
    view.store.status.set('error');
    view.store.error.set(failure('http.offline', 0));
    view.detectChanges();
    screen.getByRole('button', { name: 'Réessayer' }).click();
    expect(view.store.reload).toHaveBeenCalled();
  });
});
