import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiPaceChart, UiPacePoint } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { Budget } from '../../budget/data/models';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { addMonths, positionOf } from '../../ledger/month-context';
import { CardStatus } from '../data/dashboard.store';
import { Summary } from '../data/models';
import { cumulativeByDay, cumulativeValues, daysInMonthOf, lastShownDay } from '../support/pace-series';
import { formatWhole } from '../support/whole-units';
import { CardFrame } from './card-frame';

interface PaceView {
  readonly days: readonly UiPacePoint[];
  readonly daysInMonth: number;
  readonly today: number | undefined;
  readonly target: number | undefined;
  readonly reference: readonly number[] | undefined;
  readonly summaryText: string;
}

@Component({
  selector: 'app-pace-card',
  imports: [CardFrame, TranslatePipe, UiPaceChart],
  template: `<app-card-frame [heading]="'dashboard.pace.title' | translate" [status]="status()" [error]="error()" (retry)="retry.emit()">
    @if (view(); as chart) {
      <ui-pace-chart
        [days]="chart.days"
        [daysInMonth]="chart.daysInMonth"
        [today]="chart.today"
        [target]="chart.target"
        [reference]="chart.reference"
        [label]="'dashboard.pace.label' | translate"
        [summaryText]="chart.summaryText"
      />
      <ul class="dashboard-card__legend">
        @if (chart.target !== undefined) {
          <li><span class="dashboard-card__swatch dashboard-card__swatch--target" aria-hidden="true"></span>{{ 'dashboard.pace.target' | translate }}</li>
        }
        @if (chart.reference !== undefined) {
          <li><span class="dashboard-card__swatch dashboard-card__swatch--reference" aria-hidden="true"></span>{{ 'dashboard.pace.lastMonth' | translate }}</li>
        }
        @if (chart.today !== undefined) {
          <li><span class="dashboard-card__swatch dashboard-card__swatch--today" aria-hidden="true"></span>{{ 'dashboard.pace.today' | translate }}</li>
        }
      </ul>
      <p class="dashboard-card__muted dashboard-card__note">{{ 'dashboard.pace.fixedIncluded' | translate }}</p>
    } @else {
      <p class="dashboard-card__muted">{{ 'dashboard.pace.empty' | translate }}</p>
    }
  </app-card-frame>`,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaceCard {
  readonly summary = input.required<Summary | null>();
  readonly previous = input.required<Summary | null>();
  readonly budget = input.required<Budget | null>();
  readonly month = input.required<string>();
  readonly today = input.required<string>();
  readonly currency = input.required<CurrencyFormat>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly retry = output<void>();

  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly view = computed<PaceView | null>(() => {
    this.revision();
    const summary = this.summary();
    if (summary === null) return null;
    const month = this.month();
    const through = lastShownDay(month, this.today());
    const days = cumulativeByDay(summary, month, through);
    const spent = days.at(-1)?.value ?? 0;
    if (spent <= 0) return null;

    const budget = this.budget();
    const planned = budget !== null && budget.hasPlan ? (budget.expenses.planned ?? 0) : 0;
    const target = planned > 0 ? planned : undefined;
    const previous = this.previous();
    const reference = budget !== null && !budget.hasPlan && previous !== null ? cumulativeValues(previous, addMonths(month, -1)) : undefined;
    const current = positionOf(month, this.today()) === 'current';
    const params = { spent: formatWhole(spent, this.currency()), days: through };
    const summaryText =
      target !== undefined
        ? this.translate.instant('dashboard.pace.summaryTarget', { ...params, target: formatWhole(target, this.currency()) })
        : reference !== undefined
          ? this.translate.instant('dashboard.pace.summaryReference', { ...params, reference: formatWhole(reference[Math.min(through, reference.length) - 1] ?? 0, this.currency()) })
          : this.translate.instant('dashboard.pace.summary', params);
    return { days, daysInMonth: daysInMonthOf(month), today: current ? through : undefined, target, reference, summaryText };
  });
}
