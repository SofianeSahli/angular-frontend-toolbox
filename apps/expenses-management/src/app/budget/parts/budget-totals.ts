import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { Budget } from '../data/models';

@Component({
  selector: 'app-budget-totals',
  imports: [TranslatePipe, UiMeter],
  template: `<dl class="budget-totals">
    <dt>{{ 'budget.totals.planned' | translate }}</dt>
    <dd><bdi>{{ planned() }}</bdi></dd>
    <dt>{{ 'budget.totals.actual' | translate }}</dt>
    <dd><bdi>{{ format(budget().expenses.actual) }}</bdi></dd>
    @if (budget().expenses.remaining !== null) {
      <dt>{{ 'budget.totals.remaining' | translate }}</dt>
      <dd><bdi>{{ format(budget().expenses.remaining ?? 0) }}</bdi></dd>
    }
    <dt>{{ 'budget.totals.income' | translate }}</dt>
    <dd><bdi>{{ pair(budget().income.actual, budget().income.expected) }}</bdi></dd>
      @if (expectedRemainingIncome(); as left) {
      <dt>{{ 'budget.totals.expected_remaining_income' | translate }}</dt>
      <dd><bdi>{{ format(left.amount) }}</bdi></dd>
      <dd class="budget-totals__meter">
        <ui-meter [value]="left.meterValue" [max]="left.income" [label]="'budget.totals.expected_remaining_income' | translate" />
      </dd>
    }
    @if (hasPlanned(budget().income.expected)) {
      <dd class="budget-totals__meter">
        <ui-meter [value]="budget().income.actual" [max]="budget().income.expected ?? 0" [label]="'budget.totals.income' | translate" />
      </dd>
    }
  
    <dt>{{ 'budget.totals.saving' | translate }}</dt>
    <dd><bdi>{{ pair(budget().saving.actual, budget().saving.planned) }}</bdi></dd>
    @if (hasPlanned(budget().saving.planned)) {
      <dd class="budget-totals__meter">
        <ui-meter [value]="budget().saving.actual" [max]="budget().saving.planned ?? 0" [label]="'budget.totals.saving' | translate" />
      </dd>
    }
  </dl>`,
  styleUrl: './budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetTotals {
  readonly budget = input.required<Budget>();
  readonly plannedTotal = input.required<number>();
  readonly currency = input.required<CurrencyFormat>();

  protected readonly planned = computed(() => this.format(this.plannedTotal()));

  protected readonly expectedRemainingIncome = computed(() => {
    const { income, expenses } = this.budget();
    if (income.expected === null || income.expected <= 0 || expenses.planned === null) {
      return null;
    }
    const amount = income.expected - expenses.planned - (this.budget().saving.planned ?? 0);
    return { amount, income: income.expected, meterValue: Math.max(0, amount) };
  });

  protected format(minor: number): string {
    return formatMinor(minor, this.currency());
  }

  protected hasPlanned(planned: number | null): boolean {
    return planned !== null && planned > 0;
  }

  protected pair(actual: number, expected: number | null): string {
    return expected === null ? this.format(actual) : `${this.format(actual)} / ${this.format(expected)}`;
  }
}
