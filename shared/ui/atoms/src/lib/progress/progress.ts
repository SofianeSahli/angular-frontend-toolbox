import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';

export type UiProgressTone = 'accent' | 'warning' | 'danger';

@Component({
  selector: 'ui-progress',
  template: '<span class="ui-progress__bar" [style.inline-size.%]="filledPercent()"></span>',
  styleUrl: './progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-label]': 'label()',
    '[class.ui-progress--warning]': 'tone() === "warning"',
    '[class.ui-progress--danger]': 'tone() === "danger"',
  },
})
export class UiProgress {
  readonly value = input.required<number, unknown>({ transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly tone = input<UiProgressTone>('accent');
  readonly label = input.required<string>();

  protected readonly filledPercent = computed(() => {
    const max = this.max();
    if (!(max > 0)) return 0;
    return Math.min(Math.max(this.value() / max, 0), 1) * 100;
  });
}
