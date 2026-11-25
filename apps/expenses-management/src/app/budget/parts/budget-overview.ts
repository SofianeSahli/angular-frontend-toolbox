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
  template: `@if (shown()) {
    <section class="budget-overview" aria-labelledby="budget-overview-title">
      <h2 class="budget-parts__title" id="budget-overview-title">{{ 'budget.overview.title' | translate }}</h2>
      <div class="budget-overview__total">
        <ui-meter [value]="actual()" [max]="planned()" [state]="state()" [label]="'budget.overview.total' | translate" [valueText]="totalText()" />
        <p class="plan-line__numbers">
          <bdi>{{ totalAmounts() }}</bdi>
          @if (totalPercent() !== null) {
            · {{ 'budget.lines.percent' | translate: { percent: totalPercent() } }}
          }
        </p>
      </div>
      <ul class="budget-overview__lines">
        @for (line of lines(); track line.category) {
          <li class="budget-overview__line">
            <span class="plan-line__name"
              ><span aria-hidden="true">{{ line.emoji }}</span>&ngsp;<bdi>{{ line.label }}</bdi></span
            >
            <ui-meter [value]="line.actual" [max]="line.planned" [state]="line.state" [label]="line.label" [valueText]="line.text" />
            <p class="plan-line__numbers">
              <bdi>{{ line.amounts }}</bdi>
              · {{ line.text }}
            </p>
          </li>
        }
      </ul>
    </section>
  }`,
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
