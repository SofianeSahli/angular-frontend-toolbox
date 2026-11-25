import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.brand-mark--on-brand]': 'onBrand()',
  },
})
export class BrandMark {
  readonly onBrand = input(false, { transform: booleanAttribute });
}
