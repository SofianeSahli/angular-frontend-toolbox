import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { Budget } from '../data/models';
import { OffPlanCategory } from '../support/off-plan';

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
  template: `@if (shown()) {
    <div class="plan-line plan-line--off-list">
      <p class="plan-line__off-head m-0">
        <span>{{ 'budget.offPlan.title' | translate }}</span>
        <bdi class="plan-line__numbers">{{ amount() }}</bdi>
      </p>
      @if (rows().length > 0) {
        <button
          uiButton
          variant="ghost"
          size="sm"
          type="button"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listId"
          (click)="open.set(!open())"
        >
          {{ (open() ? 'budget.offPlan.hide' : 'budget.offPlan.show') | translate }}
        </button>
        @if (open()) {
          <ul class="off-plan-list" [id]="listId">
            @for (row of rows(); track row.code) {
              <li class="off-plan-list__row">
                <span class="plan-line__name"
                  ><span aria-hidden="true">{{ labels.emoji(row.code) }}</span>&ngsp;<bdi>{{ labels.name(row.code) }}</bdi></span
                >
                <bdi class="plan-line__numbers">{{ format(row.total) }}</bdi>
                @if (row.canAdd) {
                  <button
                    uiButton
                    variant="secondary"
                    size="sm"
                    type="button"
                    [attr.aria-label]="'budget.offPlan.addNamed' | translate: { name: labels.name(row.code) }"
                    (click)="add.emit(row)"
                  >
                    <ui-icon name="plus" />
                    {{ 'budget.offPlan.add' | translate }}
                  </button>
                }
              </li>
            }
          </ul>
        }
      }
    </div>
  }`,
  styleUrl: './budget-parts.scss',
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
