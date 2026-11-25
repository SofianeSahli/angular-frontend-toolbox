import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiAmount, UiButton, UiIcon } from '@shared/ui-atoms';
import { CurrencyFormat } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { longDate, uiLocale } from '../../operations/support/day-groups';
import { RecurringRule } from '../data/models';
import { frequencyText } from '../support/frequency-text';

@Component({
  selector: 'app-rule-row',
  imports: [TranslatePipe, UiAmount, UiButton, UiIcon],
  template: `<div class="rule-row">
    <span class="rule-row__emoji" aria-hidden="true">{{ emoji() }}</span>
    <div class="rule-row__body">
      <span class="rule-row__title"><bdi>{{ name() }}</bdi></span>
      @if (rule().comment; as comment) {
        <span class="rule-row__meta"><bdi>{{ comment }}</bdi></span>
      }
      <span class="rule-row__meta">
        {{ frequency() }} ·
        @if (rule().nextDate) {
          {{ 'recurring.next' | translate: { date: nextDate() } }}
        } @else {
          {{ 'recurring.ended' | translate }}
        }
        · {{ 'operations.list.by' | translate: { name: rule().createdBy.name } }}
      </span>
    </div>
    <bdi class="rule-row__amount" dir="ltr">
      <ui-amount [millimes]="rule().amount" [currency]="currency()" [tone]="rule().type === 'income' ? 'income' : 'neutral'" />
    </bdi>
    <div class="rule-row__actions">
      <button uiButton variant="ghost" size="sm" iconOnly type="button" [attr.aria-label]="'recurring.editRule' | translate: { name: name() }" (click)="edit.emit(rule())">
        <ui-icon name="pencil" />
      </button>
      <button uiButton variant="ghost" size="sm" iconOnly type="button" [attr.aria-label]="'recurring.deleteRule' | translate: { name: name() }" (click)="remove.emit(rule())">
        <ui-icon name="trash" />
      </button>
    </div>
  </div>`,
  styleUrl: './rule-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleRow {
  readonly rule = input.required<RecurringRule>();
  readonly currency = input.required<CurrencyFormat>();
  readonly edit = output<RecurringRule>();
  readonly remove = output<RecurringRule>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly emoji = computed(() => this.labels.emoji(this.rule().category));
  protected readonly name = computed(() => {
    this.revision();
    return this.rule().otherName || this.labels.name(this.rule().category);
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
}
