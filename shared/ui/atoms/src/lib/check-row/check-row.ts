import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'label[uiCheckRow]',
  templateUrl: './check-row.html',
  styleUrl: './check-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCheckRow {}
