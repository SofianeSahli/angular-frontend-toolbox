import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'label[uiCheckRow]',
  template: '<ng-content />',
  styleUrl: './check-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCheckRow {}
