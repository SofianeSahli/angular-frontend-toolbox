import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { UiIcon } from '@shared/ui-atoms';

export type UiMeterState = 'ok' | 'warning' | 'over';

const STATE_ICONS: Readonly<Record<UiMeterState, string | null>> = {
  ok: null,
  warning: 'triangle-exclamation-point',
  over: 'circle-exclamation-point',
};

@Component({
  selector: 'ui-meter',
  imports: [UiIcon],
  templateUrl: './meter.html',
  styleUrl: './meter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'meter',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuetext]': 'valueText() || null',
    '[attr.aria-label]': 'label()',
    '[class.ui-meter--warning]': 'state() === "warning"',
    '[class.ui-meter--over]': 'state() === "over"',
  },
})
export class UiMeter {
  readonly value = input.required<number, unknown>({ transform: numberAttribute });
  readonly max = input.required<number, unknown>({ transform: numberAttribute });
  readonly state = input<UiMeterState>('ok');
  readonly label = input.required<string>();
  readonly valueText = input<string>();

  protected readonly icon = computed(() => STATE_ICONS[this.state()]);

  protected readonly fillPercent = computed(() => {
    const max = this.max();
    if (!(max > 0)) return 0;
    return Math.min(Math.max(this.value() / max, 0), 1) * 100;
  });
}
