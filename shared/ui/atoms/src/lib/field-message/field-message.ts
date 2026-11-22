import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon } from '../icon/icon';

export type UiFieldMessageTone = 'hint' | 'error';

@Component({
  selector: 'ui-field-message',
  imports: [UiIcon],
  template: `@if (tone() === 'error') {
      <ui-icon name="circle-exclamation-point" [size]="16" />
    }
    <span><ng-content /></span>`,
  styleUrl: './field-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-field-message--error]': 'tone() === "error"',
  },
})
export class UiFieldMessage {
  readonly tone = input<UiFieldMessageTone>('hint');
}
