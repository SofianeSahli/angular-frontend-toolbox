import { ChangeDetectionStrategy, Component, computed, input, model, viewChild } from '@angular/core';
import { UiAmountKeypad } from '@shared/ui-molecules';
import { CurrencyFormat } from '@shared/util-format';

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;
const NARROW_SPACE = '\u202f';

export function typedAmount(text: string): string {
  const [whole, fraction] = text.split(/[.,]/);
  const grouped = (whole || '0').replace(THOUSANDS, NARROW_SPACE);
  return fraction === undefined ? grouped : `${grouped},${fraction}`;
}

@Component({
  selector: 'app-amount-pad',
  imports: [UiAmountKeypad],
  templateUrl: './amount-pad.html',
  styleUrl: './amount-pad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown)': 'forward($event)' },
})
export class AmountPad {
  readonly value = model('');
  readonly currency = input.required<CurrencyFormat>();
  readonly label = input.required<string>();
  readonly inputId = input<string>();
  readonly caption = input<string>();

  private readonly keypad = viewChild.required(UiAmountKeypad);

  protected readonly display = computed(() => typedAmount(this.value()));
  protected readonly empty = computed(() => this.value() === '');

  protected forward(event: KeyboardEvent): void {
    if (!event.defaultPrevented) this.keypad().handleKeydown(event);
  }
}
