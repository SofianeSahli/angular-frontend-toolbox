import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute } from '@angular/core';
import { UI_TEXT, fillUiText } from '@shared/ui-tokens';

@Component({
  selector: 'ui-stepper',
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStepper {
  readonly current = input.required<number, unknown>({ transform: numberAttribute });
  readonly total = input.required<number, unknown>({ transform: numberAttribute });

  private readonly text = inject(UI_TEXT);

  protected readonly label = computed(() => fillUiText(this.text.step, { current: this.current(), total: this.total() }));
  protected readonly bars = computed(() => Array.from({ length: Math.max(this.total(), 0) }, (_, index) => index < this.current()));
}
