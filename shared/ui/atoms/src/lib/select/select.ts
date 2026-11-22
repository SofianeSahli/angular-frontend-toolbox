import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'select[uiSelect]',
  template: '<ng-content />',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSelect {}
