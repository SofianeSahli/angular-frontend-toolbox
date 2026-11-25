import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiBadge, UiButton, UiFieldMessage, UiIcon, UiInput, UiLabel } from '@shared/ui-atoms';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { CategoryLabels } from '../../categories/data/category-labels';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { DraftLine } from '../data/budget-draft';
import { BudgetLine } from '../data/models';

let nextLineId = 0;

@Component({
  selector: 'app-plan-line-row',
  imports: [TranslatePipe, UiBadge, UiButton, UiFieldMessage, UiIcon, UiInput, UiLabel, UiMeter],
  template: `<div class="plan-line">
    <div class="plan-line__head">
      <span class="plan-line__name"
        ><span aria-hidden="true">{{ emoji() }}</span>&ngsp;<bdi>{{ name() }}</bdi></span
      >
      @if (line().retired) {
        <ui-badge tone="warning">{{ 'budget.retired' | translate }}</ui-badge>
      }
      <button
        uiButton
        variant="ghost"
        size="sm"
        iconOnly
        type="button"
        [attr.aria-label]="'budget.lines.remove' | translate: { name: name() }"
        (click)="remove.emit()"
      >
        <ui-icon name="trash" />
      </button>
    </div>
    <div class="plan-line__field">
      <label uiLabel [for]="inputId">{{ 'budget.lines.planned' | translate }}</label>
      <input
        uiInput
        type="text"
        inputmode="decimal"
        autocomplete="off"
        dir="ltr"
        [id]="inputId"
        [value]="line().text"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? errorId : null"
        (input)="changed($event)"
      />
      @if (error(); as message) {
        <ui-field-message tone="error" [id]="errorId">{{ message }}</ui-field-message>
      }
    </div>
    @if (answer(); as result) {
      <ui-meter [value]="result.actual" [max]="result.planned" [state]="result.status" [label]="name()" [valueText]="statusText()" />
      <p class="plan-line__numbers">
        <bdi>{{ 'budget.lines.actual' | translate: { amount: actualText() } }}</bdi>
        @if (result.percent !== null) {
          · {{ 'budget.lines.percent' | translate: { percent: result.percent } }}
        }
        · {{ 'budget.status.' + result.status | translate }}
      </p>
    }
    @if (lastMonth() !== null) {
      <p class="plan-line__numbers">
        <bdi>{{ 'budget.lastMonth' | translate: { amount: lastMonthText() } }}</bdi>
      </p>
    }
  </div>`,
  styleUrl: './budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanLineRow {
  readonly line = input.required<DraftLine>();
  readonly answer = input<BudgetLine | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly error = input<string | null>(null);
  readonly lastMonth = input<number | null>(null);
  readonly textChange = output<string>();
  readonly remove = output<void>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly inputId = `plan-line-${nextLineId++}`;
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly name = computed(() => {
    this.revision();
    return this.labels.name(this.line().category);
  });
  protected readonly emoji = computed(() => this.labels.emoji(this.line().category));
  protected readonly actualText = computed(() => formatMinor(this.answer()?.actual ?? 0, this.currency()));
  protected readonly lastMonthText = computed(() => formatMinor(this.lastMonth() ?? 0, this.currency()));
  protected readonly statusText = computed(() => {
    this.revision();
    const answer = this.answer();
    if (answer === null) return '';
    const status = this.translate.instant(`budget.status.${answer.status}`);
    return answer.percent === null ? status : `${this.translate.instant('budget.lines.percent', { percent: answer.percent })}, ${status}`;
  });

  protected changed(event: Event): void {
    this.textChange.emit((event.target as HTMLInputElement).value);
  }
}
