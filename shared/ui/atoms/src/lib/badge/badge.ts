import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'ui-badge',
  template: '<ng-content />',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"ui-badge--" + tone()',
  },
})
export class UiBadge {
  readonly tone = input<UiBadgeTone>('neutral');
}
