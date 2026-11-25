import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiStatSize = 'md' | 'hero';
export type UiStatTone = 'neutral' | 'accent' | 'income';

let nextStatId = 0;

@Component({
  selector: 'ui-stat',
  templateUrl: './stat.html',
  styleUrl: './stat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
    '[class.ui-stat--hero]': 'size() === "hero"',
    '[class.ui-stat--accent]': 'tone() === "accent"',
    '[class.ui-stat--income]': 'tone() === "income"',
  },
})
export class UiStat {
  readonly label = input.required<string>();
  readonly size = input<UiStatSize>('md');
  readonly tone = input<UiStatTone>('neutral');

  protected readonly labelId = `ui-stat-${nextStatId++}-label`;
}
