import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiBadge, UiBadgeTone, UiFieldMessage, UiIcon } from '@shared/ui-atoms';
import { UiMeter } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor, parseMajor } from '@shared/util-format';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { withoutUnit } from '../../support/amounts';
import { overallState } from '../../support/overview';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- a table row must stay a native tr
  selector: 'tr[appPlanLineRow]',
  imports: [TranslatePipe, UiBadge, UiFieldMessage, UiIcon, UiMeter],
  templateUrl: './plan-line-row.html',
  styleUrl: './plan-line-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'open.emit()' },
})
export class PlanLineRow {
  readonly name = input.required<string>();
  readonly emoji = input<string | null>(null);
  readonly text = input.required<string>();
  readonly actual = input(0);
  readonly currency = input.required<CurrencyFormat>();
  readonly tag = input<string | null>(null);
  readonly tagTone = input<UiBadgeTone>('neutral');
  readonly limit = input(true);
  readonly error = input<string | null>(null);
  readonly lastMonth = input<number | null>(null);
  readonly open = output<void>();

  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  private readonly plannedMinor = computed(() => {
    const parsed = parseMajor(this.text(), this.currency().exponent, { allowZero: true });
    return parsed.ok ? parsed.minor : null;
  });
  protected readonly max = computed(() => this.plannedMinor() ?? 0);
  protected readonly state = computed(() => (this.limit() ? overallState(this.actual(), this.max()) : 'ok'));
  protected readonly plannedText = computed(() => this.cell(this.plannedMinor()));
  protected readonly actualText = computed(() => this.cell(this.actual()));
  protected readonly gapText = computed(() => {
    const planned = this.plannedMinor();
    return planned === null ? '—' : withoutUnit(planned - this.actual(), this.currency(), { signed: true });
  });
  protected readonly lastMonthText = computed(() => formatMinor(this.lastMonth() ?? 0, this.currency()));
  protected readonly accessibleName = computed(() => {
    this.revision();
    const planned = this.plannedMinor();
    const label = this.translate.instant('budget.lines.rowLabel', {
      name: this.name(),
      planned: planned === null ? '—' : formatMinor(planned, this.currency()),
      spent: formatMinor(this.actual(), this.currency()),
    });
    return this.state() === 'over' ? `${label}, ${this.translate.instant('budget.status.over')}` : label;
  });

  private cell(minor: number | null): string {
    return minor === null ? '—' : withoutUnit(minor, this.currency());
  }
}
