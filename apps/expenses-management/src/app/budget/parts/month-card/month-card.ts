import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiBadge, UiButton, UiFieldMessage, UiIcon } from '@shared/ui-atoms';
import { UiMeter, UiSegmentedControl, UiSegmentedOption } from '@shared/ui-molecules';
import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { MonthPosition } from '../../../ledger/month-context';
import { unitOf, withoutUnit } from '../../support/amounts';
import { Forecast } from '../../support/forecast';
import { overallPercent, overallState } from '../../support/overview';

export type MonthView = 'plan' | 'real';

const share = (part: number, whole: number): number => (whole > 0 ? (part / whole) * 100 : 0);

let nextCardId = 0;

@Component({
  selector: 'app-month-card',
  imports: [ReactiveFormsModule, TranslatePipe, UiBadge, UiButton, UiFieldMessage, UiIcon, UiMeter, UiSegmentedControl],
  templateUrl: './month-card.html',
  styleUrls: ['./month-card.scss', './month-bar.scss', '../budget-parts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthCard {
  readonly forecast = input.required<Forecast>();
  readonly actual = input.required<number>();
  readonly left = input.required<number>();
  readonly receivedIncome = input.required<number>();
  readonly position = input.required<MonthPosition>();
  readonly daysLeft = input<number | null>(null);
  readonly currency = input.required<CurrencyFormat>();
  readonly incomeError = input<string | null>(null);
  readonly savingError = input<string | null>(null);
  readonly editIncome = output<void>();
  readonly editSaving = output<void>();

  private readonly translate = inject(TranslateService);
  private readonly revision = injectTranslationRevision();

  protected readonly detailId = `month-card-detail-${nextCardId++}`;
  protected readonly view = new FormControl<MonthView>('plan', { nonNullable: true });
  protected readonly shown = toSignal(this.view.valueChanges, { initialValue: this.view.value });
  protected readonly detailOpen = signal(false);
  protected readonly views = computed<readonly UiSegmentedOption<MonthView>[]>(() => {
    this.revision();
    return [
      { value: 'plan', label: this.translate.instant('budget.month.plan') },
      { value: 'real', label: this.translate.instant('budget.month.real') },
    ];
  });

  protected readonly over = computed(() => (this.forecast().remainder ?? 0) < 0);
  protected readonly bar = computed(() => {
    const { income, lines, saving, spending, remainder } = this.forecast();
    const scale = Math.max(income ?? 0, spending);
    return {
      lines: share(lines, scale),
      saving: share(saving, scale),
      rest: share(Math.max(remainder ?? 0, 0), scale),
      limit: share(income ?? 0, scale),
    };
  });
  protected readonly barLabel = computed(() => {
    this.revision();
    const { lines, saving, remainder } = this.forecast();
    return this.translate.instant('budget.forecast.barLabel', {
      lines: this.format(lines),
      saving: this.format(saving),
      rest: this.signed(remainder ?? 0),
    });
  });

  protected readonly unit = computed(() => unitOf(this.currency()));
  protected readonly exhausted = computed(() => this.left() === 0 && this.forecast().spending > 0);
  protected readonly state = computed(() => overallState(this.actual(), this.forecast().spending));
  protected readonly percent = computed(() => overallPercent(this.actual(), this.forecast().spending));
  protected readonly received = computed(() => {
    const expected = this.forecast().income;
    return expected !== null && this.receivedIncome() >= expected;
  });

  constructor() {
    effect(() => {
      if (this.incomeError() === null && this.savingError() === null) return;
      untracked(() => {
        this.view.setValue('plan');
        this.detailOpen.set(true);
      });
    });
  }

  protected format(minor: number): string {
    return formatMinor(minor, this.currency());
  }

  protected signed(minor: number): string {
    return formatMinor(minor, this.currency(), { signed: true });
  }

  protected bare(minor: number, signed = false): string {
    return withoutUnit(minor, this.currency(), { signed });
  }
}
