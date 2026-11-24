import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'button[uiFieldAction]',
  template: '<ng-content />',
  styleUrl: './field-action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button' },
})
export class UiFieldAction {}
