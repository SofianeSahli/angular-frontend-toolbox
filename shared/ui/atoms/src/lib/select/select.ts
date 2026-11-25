import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'select[uiSelect]',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSelect {}
