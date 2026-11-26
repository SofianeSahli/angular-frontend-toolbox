import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiMenu, UiMenuItem, UiMenuTrigger } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { DraftLine } from '../../data/budget-draft';
import { BudgetLine } from '../../data/models';
import { unitOf, withoutUnit } from '../../support/amounts';
import { PlanLineRow } from '../plan-line-row/plan-line-row';

export interface TableTotals {
  readonly planned: number;
  readonly actual: number;
  readonly left: number;
}

@Component({
  selector: 'app-lines-table',
  imports: [PlanLineRow, TranslatePipe, UiButton, UiIcon, UiMenu, UiMenuItem, UiMenuTrigger],
  templateUrl: './lines-table.html',
  styleUrls: ['./lines-table.scss', '../budget-parts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinesTable {
  readonly lines = input.required<readonly DraftLine[]>();
  readonly answers = input.required<ReadonlyMap<string, BudgetLine>>();
  readonly lineErrors = input<ReadonlyMap<string, string>>(new Map());
  readonly lastMonths = input<ReadonlyMap<string, number | null>>(new Map());
  readonly savingText = input.required<string>();
  readonly savingActual = input.required<number>();
  readonly offPlan = input.required<number>();
  readonly offPlanCount = input<number | null>(null);
  readonly totals = input.required<TableTotals>();
  readonly currency = input.required<CurrencyFormat>();
  readonly copyLabel = input.required<string>();
  readonly copying = input(false);
  readonly busy = input(false);
  readonly added = input<string | null>(null);
  readonly editLine = output<string>();
  readonly editSaving = output<void>();
  readonly addLine = output<void>();
  readonly copyPrevious = output<void>();

  protected readonly labels = inject(CategoryLabels);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly unit = computed(() => unitOf(this.currency()));

  protected amount(minor: number): string {
    return withoutUnit(minor, this.currency());
  }

  protected focusFirstRow(): void {
    const first = this.host.nativeElement.querySelector<HTMLButtonElement>('tbody button');
    first?.scrollIntoView?.({ block: 'center' });
    first?.focus({ preventScroll: true });
  }
}
