import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiBadge, UiFieldMessage } from '@shared/ui-atoms';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor, parseMajor } from '@shared/util-format';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { DraftLine } from '../../data/budget-draft';
import { BudgetLine } from '../../data/models';
import { overallState } from '../../support/overview';

@Component({
  selector: 'app-plan-line-row',
  imports: [TranslatePipe, UiBadge, UiFieldMessage, UiMeter],
  templateUrl: './plan-line-row.html',
  styleUrl: '../budget-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanLineRow {
  readonly line = input.required<DraftLine>();
  readonly answer = input<BudgetLine | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly error = input<string | null>(null);
  readonly lastMonth = input<number | null>(null);
  readonly open = output<void>();

  private readonly labels = inject(CategoryLabels);
  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly name = computed(() => {
    this.revision();
    return this.labels.name(this.line().category);
  });
  protected readonly emoji = computed(() => this.labels.emoji(this.line().category));
  private readonly plannedMinor = computed(() => {
    const parsed = parseMajor(this.line().text, this.currency().exponent, { allowZero: true });
    return parsed.ok ? parsed.minor : null;
  });
  protected readonly actual = computed(() => this.answer()?.actual ?? 0);
  protected readonly state = computed(() => overallState(this.actual(), this.plannedMinor() ?? 0));
  protected readonly plannedText = computed(() => {
    const minor = this.plannedMinor();
    return minor === null ? this.line().text : formatMinor(minor, this.currency());
  });
  protected readonly spentText = computed(() => formatMinor(this.actual(), this.currency()));
  protected readonly lastMonthText = computed(() => formatMinor(this.lastMonth() ?? 0, this.currency()));
  protected readonly accessibleName = computed(() => {
    this.revision();
    const label = this.translate.instant('budget.lines.rowLabel', { name: this.name(), planned: this.plannedText(), spent: this.spentText() });
    return this.state() === 'over' ? `${label}, ${this.translate.instant('budget.status.over')}` : label;
  });
}
