import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandMark } from '../../shell';
import { UiIcon } from '@shared/ui-atoms';

@Component({
  selector: 'app-brand-panel',
  imports: [BrandMark, TranslatePipe, UiIcon],
  templateUrl: './brand-panel.html',
  styleUrl: './brand-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandPanel {
  protected readonly benefits = ['brand.benefits.quick', 'brand.benefits.remaining', 'brand.benefits.shared'];
}
