import { DIALOG_DATA } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiButton, UiFieldMessage, UiInput, UiLabel } from '@shared/ui-atoms';
import { UI_DIALOG_CONTEXT, UiDialog, UiDialogBody, UiDialogFooter, UiDialogHeader } from '@shared/ui-organisms';
import { mediaQueryDown } from '@shared/ui-tokens';
import { CurrencyFormat, parseMajor } from '@shared/util-format';
import { firstValueFrom } from 'rxjs';
import { AmountPad } from '../../operations/parts/amount-pad';
import { parseMessage } from '../support/budget-errors';

export interface AmountSheetData {
  readonly title: string;
  readonly text: string;
  readonly currency: CurrencyFormat;
  readonly removable: boolean;
  readonly optional: boolean;
  readonly hint?: string;
}

export type AmountSheetResult = { readonly kind: 'set'; readonly text: string } | { readonly kind: 'remove' };

export function openAmountSheet(dialog: UiDialog, data: AmountSheetData): Promise<AmountSheetResult | undefined> {
  const ref = dialog.open<AmountSheetResult, AmountSheetData, AmountSheet>(AmountSheet, { data, size: 'sm', presentation: 'auto', autoFocus: '#amount-sheet-value' });
  return firstValueFrom(ref.closed, { defaultValue: undefined });
}

@Component({
  selector: 'app-amount-sheet',
  imports: [AmountPad, TranslatePipe, UiButton, UiDialogBody, UiDialogFooter, UiDialogHeader, UiFieldMessage, UiInput, UiLabel],
  templateUrl: './amount-sheet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmountSheet {
  protected readonly data = inject<AmountSheetData>(DIALOG_DATA);
  protected readonly context = inject(UI_DIALOG_CONTEXT);
  private readonly translate = inject(TranslateService);
  protected readonly keypad = inject(DOCUMENT).defaultView?.matchMedia?.(mediaQueryDown('medium')).matches ?? false;

  protected readonly text = signal(this.data.text);
  protected readonly submitted = signal(false);
  protected readonly error = computed(() => {
    const text = this.text().trim();
    if (text === '' && this.data.optional) return null;
    const parsed = parseMajor(text, this.data.currency.exponent, { allowZero: true });
    return parsed.ok ? null : parseMessage(this.translate, parsed.reason);
  });

  protected setText(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  protected confirm(): void {
    this.submitted.set(true);
    if (this.error() === null) this.context.close({ kind: 'set', text: this.text().trim() } satisfies AmountSheetResult);
  }

  protected remove(): void {
    this.context.close({ kind: 'remove' } satisfies AmountSheetResult);
  }
}
