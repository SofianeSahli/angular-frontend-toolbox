import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { UI_TEXT } from '@shared/ui-tokens';

export type UiKeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'separator' | 'delete';

export interface UiKeypadOptions {
  readonly decimals: number;
  readonly separator: string;
  readonly maxDigits: number;
}

interface KeyView {
  readonly key: UiKeypadKey;
  readonly label: string;
  readonly name: string | null;
  readonly disabled: boolean;
}

const DIGIT_KEYS: readonly UiKeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const DIGIT = /^\d$/;
const SEPARATOR_KEYS = new Set([',', '.']);

export function pressKeypadKey(text: string, key: UiKeypadKey, options: UiKeypadOptions): string {
  if (key === 'delete') return text.slice(0, -1);
  const separatorAt = text.indexOf(options.separator);
  if (key === 'separator') {
    if (options.decimals === 0 || separatorAt >= 0) return text;
    return `${text === '' ? '0' : text}${options.separator}`;
  }
  if (separatorAt >= 0) return text.length - separatorAt - 1 >= options.decimals ? text : text + key;
  if (text === '0') return key;
  return text.length >= options.maxDigits ? text : text + key;
}

@Component({
  selector: 'ui-amount-keypad',
  templateUrl: './amount-keypad.html',
  styleUrl: './amount-keypad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    dir: 'ltr',
    '[attr.aria-label]': 'ariaLabel() ?? text.keypad',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class UiAmountKeypad {
  readonly value = model('');
  readonly decimals = input(2);
  readonly separator = input(',');
  readonly maxDigits = input(9);
  readonly ariaLabel = input<string>();

  protected readonly text = inject(UI_TEXT);

  protected readonly keys = computed<readonly KeyView[]>(() => [
    ...DIGIT_KEYS.map((key) => ({ key, label: key, name: null, disabled: false })),
    { key: 'separator', label: this.separator(), name: this.text.keypadSeparator, disabled: this.decimals() === 0 },
    { key: '0', label: '0', name: null, disabled: false },
    { key: 'delete', label: '⌫', name: this.text.keypadDelete, disabled: false },
  ]);

  press(key: UiKeypadKey): void {
    const next = pressKeypadKey(this.value(), key, { decimals: this.decimals(), separator: this.separator(), maxDigits: this.maxDigits() });
    if (next !== this.value()) this.value.set(next);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = this.keyFor(event.key);
    if (key === null) return;
    event.preventDefault();
    this.press(key);
  }

  private keyFor(pressed: string): UiKeypadKey | null {
    if (DIGIT.test(pressed)) return pressed as UiKeypadKey;
    if (SEPARATOR_KEYS.has(pressed)) return this.decimals() === 0 ? null : 'separator';
    return pressed === 'Backspace' ? 'delete' : null;
  }
}
