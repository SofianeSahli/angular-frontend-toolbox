import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

export type UiHeadingLevel = 2 | 3 | 4 | 5 | 6;

@Component({
  selector: 'ui-section-header',
  template: `@switch (level()) {
      @case (3) {
        <h3 class="ui-section-header__title">{{ title() }}</h3>
      }
      @case (4) {
        <h4 class="ui-section-header__title">{{ title() }}</h4>
      }
      @case (5) {
        <h5 class="ui-section-header__title">{{ title() }}</h5>
      }
      @case (6) {
        <h6 class="ui-section-header__title">{{ title() }}</h6>
      }
      @default {
        <h2 class="ui-section-header__title">{{ title() }}</h2>
      }
    }
    <div class="ui-section-header__aside"><ng-content /></div>`,
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSectionHeader {
  readonly title = input.required<string>();
  readonly level = input<UiHeadingLevel, unknown>(2, { transform: (value) => numberAttribute(value, 2) as UiHeadingLevel });
}
