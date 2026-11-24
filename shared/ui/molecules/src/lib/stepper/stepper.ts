import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute } from '@angular/core';
import { UI_TEXT, fillUiText } from '@shared/ui-tokens';

@Component({
  selector: 'ui-stepper',
  template: `<span class="ui-stepper__label">{{ label() }}</span>
    <span class="ui-stepper__bars" aria-hidden="true">
      @for (done of bars(); track $index) {
        <span class="ui-stepper__bar" [class.ui-stepper__bar--done]="done"></span>
      }
    </span>`,
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
