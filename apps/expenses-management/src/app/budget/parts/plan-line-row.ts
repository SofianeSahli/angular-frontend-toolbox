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
  templateUrl: './plan-line-row.html',
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
