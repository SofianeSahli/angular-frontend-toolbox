import { ChangeDetectionStrategy, Component, computed, effect, inject, input, numberAttribute, output, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import { UiValueAccessor } from '../shared/value-accessor';

const NON_DIGITS = /\D/g;

@Component({
  selector: 'ui-code-input',
  template: `<input
      class="ui-code-input__native"
      inputmode="numeric"
      autocomplete="one-time-code"
      dir="ltr"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-invalid]="showInvalid() ? 'true' : null"
      [value]="value() ?? ''"
      [disabled]="isDisabled()"
      (input)="onInput($event)"
      (focus)="focused.set(true)"
      (blur)="focused.set(false); markTouched()"
    />
    @for (digit of cells(); track $index) {
      <span class="ui-code-input__cell" [class.ui-code-input__cell--active]="activeCell() === $index" aria-hidden="true">{{ digit }}</span>
    }`,
  styleUrl: './code-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    dir: 'ltr',
    '[class.ui-code-input--invalid]': 'showInvalid()',
  },
})
export class UiCodeInput extends UiValueAccessor<string> {
  readonly length = input(6, { transform: numberAttribute });
  readonly ariaLabel = input<string>();
  readonly completed = output<string>();

  protected readonly focused = signal(false);
  private readonly controlInvalid = signal(false);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  protected readonly cells = computed(() => Array.from({ length: this.length() }, (_, index) => (this.value() ?? '')[index] ?? ''));
  protected readonly activeCell = computed(() => (this.focused() ? Math.min((this.value() ?? '').length, this.length() - 1) : -1));
  protected readonly showInvalid = computed(() => this.controlInvalid());

  constructor() {
    super();
    if (this.ngControl) this.ngControl.valueAccessor = this;
    effect((onCleanup) => {
      const control = this.ngControl?.control;
      if (!control) return;
      const read = () => this.controlInvalid.set(control.invalid && control.touched);
      read();
      const subscription = control.events.subscribe(read);
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected onInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const digits = event.target.value.replace(NON_DIGITS, '').slice(0, this.length());
    event.target.value = digits;
    this.commit(digits);
    if (digits.length === this.length()) this.completed.emit(digits);
  }
}
