import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiConfirm, UiDialog, UiToast } from '@shared/ui-organisms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import fr from '../../../../public/i18n/fr.json';
import { CategoriesStore } from '../../categories/data/categories.store';
import { CategoryLabels } from '../../categories/data/category-labels';
import { Summary } from '../../dashboard/data/models';
import { nodeDto, summary } from '../../dashboard/testing';
import { TREE } from '../../categories/testing';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { FAKE_LABELS } from '../../testing/render-part';
import { BudgetBusy, BudgetStatus, BudgetStore, BudgetWriteResult } from '../data/budget.store';
import { Budget, BudgetInput } from '../data/models';
import { NO_PLAN, budget, lineDto } from '../testing';
import { budgetLeaveGuard } from './budget-leave.guard';
import { BudgetPage } from './budget-page';

const failure = (code: string, status: number, fields: Record<string, string[]> = {}) =>
  new ApiError(status === 409 ? 'conflict' : status === 0 ? 'offline' : 'validation', status, code, fields, null, 'r1');

function fakeStore(initial: Budget) {
  const bookId = signal<string | null>(null);
  const month = signal<string | null>(null);
  const current = signal<Budget | null>(initial);
  return {
    summary: signal<Summary | null>(null),
    previous: signal<Summary | null>(null),
    bookId,
    month,
    budget: current,
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
  const dialog = { open: vi.fn(() => ({ closed: of('health') })) };
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
  return { ...view, store, confirm, dialog, router, settle, toasts: () => TestBed.inject(UiToast).toasts() };
}

const type = (label: string | RegExp, value: string) => fireEvent.input(screen.getAllByLabelText(label)[0], { target: { value } });

describe('BudgetPage (spec 008 REQ-5.1, 5.6–5.9, 5.11, 8.5)', () => {
  it('opens the month of the query and shows income, saving and lines', async () => {
    const { store } = await renderBudget();
    expect(store.open).toHaveBeenCalledWith('b1', '2026-11');
    expect((screen.getByLabelText(/Revenu prévu/) as HTMLInputElement).value).toBe('2500,000');
    expect(screen.getAllByLabelText('Prévu')).toHaveLength(4);
    expect(screen.getByText('Hors budget')).toBeTruthy();
  });

  it('shows the overview first, before the lines (REQ-9.12)', async () => {
    await renderBudget();
    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent?.trim());
    expect(titles.indexOf("Vue d'ensemble")).toBe(0);
    expect(titles.indexOf("Vue d'ensemble")).toBeLessThan(titles.indexOf('Lignes du budget'));
  });

  it('hides the overview for a month without lines', async () => {
    await renderBudget(NO_PLAN);
    expect(screen.queryByRole('heading', { name: "Vue d'ensemble" })).toBeNull();
  });

  it('shows what was spent last month under each line and nothing when it is unknown (REQ-9.14)', async () => {
    const view = await renderBudget();
    expect(screen.queryByText(/Le mois dernier/)).toBeNull();
    view.store.previous.set(summary({ categories: [nodeDto('food', 450000), nodeDto('transport', 80000)] }));
    view.detectChanges();
    const texts = screen.getAllByText(/Le mois dernier/).map((element) => element.textContent ?? '');
    expect(texts).toHaveLength(4);
    expect(texts.some((text) => text.includes('450'))).toBe(true);
    expect(texts.some((text) => /: 0[^\d]/.test(text))).toBe(true);
  });

  it('lists the unplanned categories and adds one to the draft with its amount, making the page dirty (REQ-9.13)', async () => {
    const view = await renderBudget();
    view.store.summary.set(summary({ categories: [nodeDto('food', 600000), nodeDto('health', 9000)] }));
    view.detectChanges();
    screen.getByRole('button', { name: 'Voir le détail' }).click();
    view.detectChanges();
    expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(true);
    screen.getByRole('button', { name: 'Ajouter Nom health au budget' }).click();
    view.detectChanges();
    expect(screen.getAllByLabelText('Prévu')).toHaveLength(5);
    expect((screen.getAllByLabelText('Prévu') as HTMLInputElement[]).some((field) => field.value === '9,000')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Ajouter Nom health au budget' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(false);
    view.confirm.ask.mockResolvedValueOnce(false);
    expect(await view.router.navigateByUrl('/ailleurs')).toBe(false);
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.leave.title }));
  });

  it('invites to plan an empty month', async () => {
    await renderBudget(NO_PLAN);
    expect(screen.getByText(fr.budget.noPlan)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copier le mois dernier' })).toBeTruthy();
  });

  it('saves the whole month and shows a toast', async () => {
    const view = await renderBudget();
    type('Prévu', '650');
    view.detectChanges();
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(view.store.save).toHaveBeenCalledWith(expect.objectContaining({ expectedIncome: 2500000, plannedSaving: 300000 }));
    expect(view.store.save.mock.calls[0][0].lines[0]).toEqual({ category: 'food', planned: 650000 });
    expect(view.toasts().map((t) => t.message)).toContain(fr.budget.saved);
  });

  it('keeps a refused draft and shows the codes on their lines', async () => {
    const view = await renderBudget();
    view.store.save.mockResolvedValueOnce({ outcome: 'error', error: failure('validation.failed', 422, { 'lines.2.planned': ['lines.planned.max'], lines: ['lines.max'] }) });
    type('Prévu', '650');
    view.detectChanges();
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(screen.getByText(fr.budget.fields.lines.planned.max)).toBeTruthy();
    expect(screen.getByText(fr.budget.fields.lines.max)).toBeTruthy();
    expect((screen.getAllByLabelText('Prévu')[0] as HTMLInputElement).value).toBe('650');
  });

  it('shows the offline message and keeps the draft', async () => {
    const view = await renderBudget();
    view.store.save.mockResolvedValueOnce({ outcome: 'error', error: failure('http.offline', 0) });
    type('Prévu', '650');
    view.detectChanges();
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(screen.getByText(fr.budget.errors.offline)).toBeTruthy();
  });

  it('confirms before clearing an existing plan', async () => {
    const view = await renderBudget(budget({ lines: [lineDto('food')], income: { expected: null, actual: 0 }, saving: { planned: null, actual: 0 } }));
    view.confirm.ask.mockResolvedValueOnce(false);
    screen.getByRole('button', { name: /Retirer/ }).click();
    view.detectChanges();
    screen.getByRole('button', { name: 'Enregistrer' }).click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.clear.title }));
    expect(view.store.save).not.toHaveBeenCalled();
  });

  it('copies at once into an untouched empty month', async () => {
    const view = await renderBudget(NO_PLAN);
    screen.getByRole('button', { name: 'Copier le mois dernier' }).click();
    await view.settle();
    expect(view.confirm.ask).not.toHaveBeenCalled();
    expect(view.store.copy).toHaveBeenCalledWith(false);
  });

  it('confirms the replacement of an existing plan', async () => {
    const view = await renderBudget();
    screen.getByRole('button', { name: 'Copier le mois dernier' }).click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.copy.replaceTitle }));
    expect(view.store.copy).toHaveBeenCalledWith(true);
  });

  it('offers to replace when someone saved meanwhile', async () => {
    const view = await renderBudget(NO_PLAN);
    view.store.copy.mockResolvedValueOnce({ outcome: 'error', error: failure('budget.not_empty', 409) });
    screen.getByRole('button', { name: 'Copier le mois dernier' }).click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledTimes(1);
    expect(view.store.copy.mock.calls.map((call) => call[0])).toEqual([false, true]);
  });

  it('says when the previous month has no budget', async () => {
    const view = await renderBudget(NO_PLAN);
    view.store.copy.mockResolvedValueOnce({ outcome: 'error', error: failure('budget.nothing_to_copy', 409) });
    screen.getByRole('button', { name: 'Copier le mois dernier' }).click();
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
    expect(screen.getAllByLabelText('Prévu')).toHaveLength(5);
  });

  it('asks before leaving or changing month with unsaved changes', async () => {
    const view = await renderBudget();
    type('Prévu', '650');
    view.detectChanges();
    view.confirm.ask.mockResolvedValueOnce(false);
    screen.getByRole('button', { name: /suivant/i }).click();
    await view.settle();
    expect(view.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: fr.budget.leave.title }));
    expect(view.router.url).toBe('/budget?mois=2026-11');
    view.confirm.ask.mockResolvedValueOnce(false);
    expect(await view.router.navigateByUrl('/ailleurs')).toBe(false);
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
