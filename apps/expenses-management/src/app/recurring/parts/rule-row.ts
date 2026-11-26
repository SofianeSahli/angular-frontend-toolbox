import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiAmount } from '@shared/ui-atoms';
import { CurrencyFormat } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { longDate, uiLocale } from '../../operations/support/day-groups';
import { RecurringRule } from '../data/models';
import { frequencyText } from '../support/frequency-text';

@Component({
  selector: 'app-rule-row',
  imports: [TranslatePipe, UiAmount],
  templateUrl: './rule-row.html',
  styleUrl: './rule-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleRow {
  readonly rule = input.required<RecurringRule>();
  readonly currency = input.required<CurrencyFormat>();
  readonly edit = output<RecurringRule>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly emoji = computed(() => this.labels.emoji(this.rule().category));
  protected readonly name = computed(() => {
    this.revision();
    return this.rule().comment || this.rule().otherName || this.labels.name(this.rule().category);
  });
  protected readonly frequency = computed(() => {
    this.revision();
    return frequencyText(this.translate, this.rule().frequency, this.rule().interval);
  });
  protected readonly nextDate = computed(() => {
    this.revision();
    const next = this.rule().nextDate;
    return next === null ? '' : longDate(next, uiLocale(this.translate.getCurrentLang()));
  });

  protected readonly accessibleName = computed(() => {
    this.revision();
    const next = this.rule().nextDate === null ? this.translate.instant('recurring.ended') : this.translate.instant('recurring.next', { date: this.nextDate() });
    return this.translate.instant('recurring.rowLabel', { name: this.name(), frequency: this.frequency(), next });
  });
}
