import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiPaceChart, UiPacePoint } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { Budget } from '../../../budget/data/models';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { addMonths, positionOf } from '../../../ledger/month-context';
import { CardStatus } from '../../../dashboard/data/card';
import { Summary } from '../../../dashboard/data/models';
import { FixedCard } from '../../data/analysis.store';
import { withoutFixed } from '../../support/fixed-bills';
import { cumulativeByDay, cumulativeValues, daysInMonthOf, lastShownDay } from '../../support/pace-series';
import { formatWhole } from '../../../dashboard/support/whole-units';
import { CardFrame } from '../../../dashboard/parts/card-frame/card-frame';

interface PaceView {
  readonly days: readonly UiPacePoint[];
  readonly daysInMonth: number;
  readonly today: number | undefined;
  readonly target: number | undefined;
  readonly reference: readonly number[] | undefined;
  readonly summaryText: string;
  readonly fixedExcluded: boolean;
}

@Component({
  selector: 'app-pace-card',
  imports: [CardFrame, TranslatePipe, UiPaceChart],
  templateUrl: './pace-card.html',
  styleUrl: '../../../dashboard/parts/dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaceCard {
  readonly summary = input.required<Summary | null>();
  readonly previous = input.required<Summary | null>();
  readonly budget = input.required<Budget | null>();
  readonly fixed = input<FixedCard | null>(null);
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
    const fixed = this.fixed();
    const fixedExcluded = fixed !== null && fixed.complete;
    const allDays = cumulativeByDay(summary, month, through);
    const days = fixedExcluded ? withoutFixed(allDays, fixed.bills) : allDays;
    const spent = days.at(-1)?.value ?? 0;
    if ((allDays.at(-1)?.value ?? 0) <= 0) return null;

    const budget = this.budget();
    const planned = budget !== null && budget.hasPlan ? (budget.expenses.planned ?? 0) - (fixedExcluded ? fixed.bills.total : 0) : 0;
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
    return { days, daysInMonth: daysInMonthOf(month), today: current ? through : undefined, target, reference, summaryText, fixedExcluded };
  });
}
