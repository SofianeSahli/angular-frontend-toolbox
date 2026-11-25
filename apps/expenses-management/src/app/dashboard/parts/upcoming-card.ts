import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiAmount } from '@shared/ui-atoms';
import { UiList, UiListItem } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { uiLocale } from '../../operations/support/day-groups';
import { RecurringRule } from '../../recurring/data/models';
import { CardStatus } from '../data/dashboard.store';
import { lastDayOf } from '../../ledger/month-context';
import { CardFrame } from './card-frame';

export const UPCOMING_SIZE = 5;

export function upcomingRules(rules: readonly RecurringRule[], today: string, month: string): RecurringRule[] {
  const last = lastDayOf(month);
  return rules
    .filter((rule) => rule.nextDate !== null && rule.nextDate > today && rule.nextDate <= last)
    .sort((a, b) => (a.nextDate ?? '').localeCompare(b.nextDate ?? ''))
    .slice(0, UPCOMING_SIZE);
}

function shortDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

@Component({
  selector: 'app-upcoming-card',
  imports: [CardFrame, RouterLink, TranslatePipe, UiAmount, UiList, UiListItem],
  templateUrl: './upcoming-card.html',
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingCard {
  readonly rules = input.required<readonly RecurringRule[]>();
  readonly status = input<CardStatus>('ready');
  readonly error = input<ApiError | null>(null);
  readonly today = input.required<string>();
  readonly month = input.required<string>();
  readonly currency = input.required<CurrencyFormat>();
  readonly retry = output<void>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly rows = computed(() => {
    this.revision();
    const locale = uiLocale(this.translate.getCurrentLang());
    return upcomingRules(this.rules(), this.today(), this.month()).map((rule) => ({
      id: rule.id,
      type: rule.type,
      amount: rule.amount,
      comment: rule.comment,
      date: shortDate(rule.nextDate ?? '', locale),
      emoji: this.labels.emoji(rule.category),
      name: rule.otherName || this.labels.name(rule.category),
    }));
  });
}
