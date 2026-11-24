import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandMark } from '@expenses/shell';
import { UiIcon } from '@shared/ui-atoms';

@Component({
  selector: 'app-brand-panel',
  imports: [BrandMark, TranslatePipe, UiIcon],
  template: `<expenses-brand-mark onBrand />
    <div class="brand-panel__body">
      <p class="brand-panel__promise">{{ 'brand.promise' | translate }}</p>
      <ul class="brand-panel__benefits">
        @for (benefit of benefits; track benefit) {
          <li><ui-icon name="check" />{{ benefit | translate }}</li>
        }
      </ul>
    </div>
    <p class="brand-panel__note">{{ 'brand.note' | translate }}</p>`,
  styleUrl: './brand-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandPanel {
  protected readonly benefits = ['brand.benefits.quick', 'brand.benefits.remaining', 'brand.benefits.shared'];
}
