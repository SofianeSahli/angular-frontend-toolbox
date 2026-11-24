import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  template: `<span class="brand-mark__logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21V9" />
        <path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5zM12 11c0-3 2-6 6-6 0 4-3 6-6 6z" />
      </svg>
    </span>
    <span class="brand-mark__name" dir="ltr" lang="fr">Olivier</span>`,
  styleUrl: './brand-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.brand-mark--on-brand]': 'onBrand()',
  },
})
export class BrandMark {
  readonly onBrand = input(false, { transform: booleanAttribute });
}
