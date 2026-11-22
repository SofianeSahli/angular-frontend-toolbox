import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { UI_TEXT } from '@shared/ui-tokens';

@Component({
  selector: 'label[uiLabel]',
  template: `<ng-content />
    @if (optional()) {
      &ngsp;<span class="ui-label__optional">{{ text.optional }}</span>
    }
    @if (required()) {
      <span class="ui-label__required" aria-hidden="true">*</span>
    }`,
  styleUrl: './label.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiLabel {
  readonly optional = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  protected readonly text = inject(UI_TEXT);
}
