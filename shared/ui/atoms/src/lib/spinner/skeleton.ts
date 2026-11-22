import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiSkeletonShape = 'line' | 'block' | 'circle';

@Component({
  selector: 'ui-skeleton',
  template: '',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class]': '"ui-skeleton--" + shape()',
  },
})
export class UiSkeleton {
  readonly shape = input<UiSkeletonShape>('line');
}
