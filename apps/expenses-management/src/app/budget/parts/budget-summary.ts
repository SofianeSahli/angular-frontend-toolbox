import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton } from '@shared/ui-atoms';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { Budget } from '../data/models';
import { overallPercent, overallState } from '../support/overview';

@Component({
  selector: 'app-budget-summary',
  imports: [TranslatePipe, UiButton, UiMeter],
  templateUrl: './budget-summary.html',
  styleUrl: './budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetSummary {
  readonly budget = input.required<Budget>();
  readonly plannedTotal = input.required<number>();
  readonly currency = input.required<CurrencyFormat>();
  readonly copyLabel = input.required<string>();
  readonly copying = input(false);
  readonly busy = input(false);
  readonly copyPrevious = output<void>();

  protected readonly actual = computed(() => this.budget().expenses.actual);
  protected readonly remaining = computed(() => this.plannedTotal() - this.actual());
  protected readonly state = computed(() => overallState(this.actual(), this.plannedTotal()));
  protected readonly percent = computed(() => overallPercent(this.actual(), this.plannedTotal()));

  protected format(minor: number): string {
    return formatMinor(minor, this.currency());
  }
}
