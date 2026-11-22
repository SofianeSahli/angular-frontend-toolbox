import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'input[type=checkbox][uiCheckbox]',
  template: '',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[indeterminate]': 'indeterminate()',
  },
})
export class UiCheckbox {
  readonly indeterminate = input(false, { transform: booleanAttribute });
}
