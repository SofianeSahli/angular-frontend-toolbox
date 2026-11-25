import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiTrendBars, UiTrendItem } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { MONTH_PARAM } from '../../ledger/month-context';
import { uiLocale } from '../../operations/support/day-groups';
import { CardStatus } from '../data/dashboard.store';
import { Summary } from '../data/models';
import { averageOf, trendItems } from '../support/trend-series';
import { formatWhole } from '../support/whole-units';
import { CardFrame } from './card-frame';

export function shortMonth(month: string, locale: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

@Component({
  selector: 'app-trend-card',
  imports: [CardFrame, TranslatePipe, UiTrendBars],
  templateUrl: './trend-card.html',
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendCard {
  readonly summary = input.required<Summary | null>();
  readonly month = input.required<string>();
  readonly currency = input.required<CurrencyFormat>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly retry = output<void>();

  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly revision = injectTranslationRevision();

  private readonly months = computed(() => {
    const summary = this.summary();
    return summary === null ? [] : trendItems(summary, this.month());
  });

  protected readonly items = computed<readonly UiTrendItem[]>(() => {
    this.revision();
    const locale = uiLocale(this.translate.getCurrentLang());
    return this.months().map((item) => ({
      id: item.month,
      label: shortMonth(item.month, locale),
      value: item.expense,
      valueText: formatWhole(item.expense, this.currency()),
      current: item.month === this.month(),
    }));
  });

  protected readonly averageText = computed(() => {
    this.revision();
    const average = averageOf(this.months());
    return average === null ? undefined : this.translate.instant('dashboard.trend.average', { amount: formatWhole(average, this.currency()) });
  });

  protected open(month: string): void {
    void this.router.navigate(['/'], { queryParams: { [MONTH_PARAM]: month } });
  }
}
