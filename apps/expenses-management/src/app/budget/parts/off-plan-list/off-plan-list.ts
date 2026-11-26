import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { Budget } from '../../data/models';
import { OffPlanCategory } from '../../support/off-plan';

export interface OffPlanItem extends OffPlanCategory {
  readonly canAdd: boolean;
}

export function showsOffPlan(budget: Budget): boolean {
  return budget.expenses.offPlan !== null && budget.expenses.offPlan > 0;
}

let nextListId = 0;

@Component({
  selector: 'app-off-plan-list',
  imports: [TranslatePipe, UiButton, UiIcon],
  templateUrl: './off-plan-list.html',
  styleUrl: '../budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffPlanList {
  readonly budget = input.required<Budget>();
  readonly rows = input<readonly OffPlanItem[]>([]);
  readonly currency = input.required<CurrencyFormat>();
  readonly add = output<OffPlanCategory>();

  protected readonly labels = inject(CategoryLabels);
  protected readonly open = signal(false);
  protected readonly listId = `off-plan-list-${nextListId++}`;
  protected readonly shown = computed(() => showsOffPlan(this.budget()));
  protected readonly amount = computed(() => formatMinor(this.budget().expenses.offPlan ?? 0, this.currency()));

  protected format(minor: number): string {
    return formatMinor(minor, this.currency());
  }
}
