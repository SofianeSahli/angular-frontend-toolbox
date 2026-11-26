import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { uiLocale } from '../../../operations/support/day-groups';
import { RecurringRule } from '../../../recurring/data/models';
import { dueDatesIn } from '../../../recurring/support/due-dates';
import { isLive } from '../../../recurring/support/monthly-average';

interface KnownRow {
  readonly id: string;
  readonly label: string;
  readonly amount: string;
}

export function dueInMonth(rules: readonly RecurringRule[], month: string): { rule: RecurringRule; dates: string[] }[] {
  return rules
    .filter(isLive)
    .map((rule) => ({ rule, dates: dueDatesIn(rule, month) }))
    .filter((item) => item.dates.length > 0);
}

@Component({
  selector: 'app-known-rules-card',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './known-rules-card.html',
  styleUrl: '../budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnownRulesCard {
  readonly rules = input.required<readonly RecurringRule[]>();
  readonly month = input.required<string>();
  readonly monthName = input.required<string>();
  readonly currency = input.required<CurrencyFormat>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  private readonly due = computed(() => dueInMonth(this.rules(), this.month()));
  protected readonly rows = computed<readonly KnownRow[]>(() => {
    this.revision();
    const days = new Intl.DateTimeFormat(uiLocale(this.translate.getCurrentLang()), { day: 'numeric', month: 'short', timeZone: 'UTC' });
    return this.due().map(({ rule, dates }) => {
      const when = dates.map((date) => days.format(new Date(`${date}T00:00:00Z`))).join(', ');
      const name = rule.comment || rule.otherName || this.labels.name(rule.category);
      const amount = formatMinor(rule.amount * dates.length, this.currency(), { signed: rule.type === 'income' });
      return { id: rule.id, label: `${name} · ${when}`, amount };
    });
  });
  protected readonly expenseTotal = computed(() =>
    formatMinor(
      this.due()
        .filter(({ rule }) => rule.type === 'expense')
        .reduce((sum, { rule, dates }) => sum + rule.amount * dates.length, 0),
      this.currency(),
    ),
  );
}
