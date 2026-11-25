import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

export type UiHeadingLevel = 2 | 3 | 4 | 5 | 6;

@Component({
  selector: 'ui-section-header',
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSectionHeader {
  readonly title = input.required<string>();
  readonly level = input<UiHeadingLevel, unknown>(2, { transform: (value) => numberAttribute(value, 2) as UiHeadingLevel });
}
