import { ChangeDetectionStrategy, Component, computed, effect, input, isDevMode } from '@angular/core';
import { CurrencyFormat, TND, formatMinor } from '@shared/util-format';

export type UiAmountDisplay = 'full' | 'rounded';
export type UiAmountTone = 'neutral' | 'income';
export type UiAmountSize = 'md' | 'hero';

const SPACE_BEFORE_CURRENCY = String.fromCharCode(0x00a0);

type Formatted = { readonly value: string; readonly unit: string } | { readonly error: unknown };

function splitUnit(text: string): { value: string; unit: string } {
  const unitStart = text.lastIndexOf(SPACE_BEFORE_CURRENCY);
  return unitStart < 0 ? { value: text, unit: '' } : { value: text.slice(0, unitStart), unit: text.slice(unitStart + 1) };
}

@Component({
  selector: 'ui-amount',
  template: `@if (parts(); as amount) {
      {{ amount.value }}@if (amount.unit) {&ngsp;<span class="ui-amount__unit">{{ amount.unit }}</span>}
    }`,
  styleUrl: './amount.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-amount--income]': 'tone() === "income"',
    '[class.ui-amount--hero]': 'size() === "hero"',
  },
})
export class UiAmount {
  readonly millimes = input.required<number>();
  readonly display = input<UiAmountDisplay>('full');
  readonly tone = input<UiAmountTone>('neutral');
  readonly size = input<UiAmountSize>('md');
  readonly currency = input<CurrencyFormat>(TND);

  private readonly formatted = computed<Formatted>(() => {
    try {
      return splitUnit(formatMinor(this.millimes(), this.currency(), { display: this.display(), signed: this.tone() === 'income' }));
    } catch (error) {
      return { error };
    }
  });

  protected readonly parts = computed(() => {
    const formatted = this.formatted();
    return 'error' in formatted ? null : formatted;
  });

  constructor() {
    effect(() => {
      const formatted = this.formatted();
      if (isDevMode() && 'error' in formatted) console.error('ui-amount:', formatted.error);
    });
  }
}
