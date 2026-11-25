import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { Budget } from '../data/models';

@Component({
  selector: 'app-budget-totals',
  imports: [TranslatePipe, UiMeter],
  templateUrl: './budget-totals.html',
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
