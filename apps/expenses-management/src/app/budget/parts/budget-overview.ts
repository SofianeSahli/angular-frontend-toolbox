import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { Budget, LineStatus } from '../data/models';
import { overallPercent, overallState, overviewLines } from '../support/overview';

interface OverviewLine {
  readonly category: string;
  readonly label: string;
  readonly emoji: string;
  readonly planned: number;
  readonly actual: number;
  readonly state: LineStatus;
  readonly text: string;
  readonly amounts: string;
}

@Component({
  selector: 'app-budget-overview',
  imports: [TranslatePipe, UiMeter],
  templateUrl: './budget-overview.html',
  styleUrl: './budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetOverview {
  readonly budget = input.required<Budget>();
  readonly currency = input.required<CurrencyFormat>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly shown = computed(() => this.budget().lines.length > 0);
  protected readonly planned = computed(() => this.budget().expenses.planned ?? 0);
  protected readonly actual = computed(() => this.budget().expenses.actual);
  protected readonly state = computed(() => overallState(this.actual(), this.planned()));
  protected readonly totalPercent = computed(() => overallPercent(this.actual(), this.planned()));
  protected readonly totalAmounts = computed(() => {
    this.revision();
    return this.translate.instant('budget.overview.amounts', { spent: this.format(this.actual()), planned: this.format(this.planned()) });
  });
  protected readonly totalText = computed(() => {
    this.revision();
    return this.statusText(this.state(), this.totalPercent());
  });

  protected readonly lines = computed<readonly OverviewLine[]>(() => {
    this.revision();
    return overviewLines(this.budget().lines).map((line) => ({
      category: line.category,
      label: this.labels.name(line.category),
      emoji: this.labels.emoji(line.category),
      planned: line.planned,
      actual: line.actual,
      state: line.status,
      text: this.statusText(line.status, line.percent),
      amounts: this.translate.instant('budget.overview.amounts', { spent: this.format(line.actual), planned: this.format(line.planned) }),
    }));
  });

  private format(minor: number): string {
    return formatMinor(minor, this.currency());
  }

  private statusText(status: LineStatus, percent: number | null): string {
    const label = this.translate.instant(`budget.status.${status}`);
    return percent === null ? label : `${this.translate.instant('budget.lines.percent', { percent })}, ${label}`;
  }
}
