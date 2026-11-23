import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiStatSize = 'md' | 'hero';
export type UiStatTone = 'neutral' | 'accent' | 'income';

let nextStatId = 0;

@Component({
  selector: 'ui-stat',
  template: `<span class="ui-stat__label" [id]="labelId">{{ label() }}</span>
    <span class="ui-stat__value"><ng-content /></span>
    <span class="ui-stat__meta"><ng-content select="[uiStatMeta]" /></span>`,
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
