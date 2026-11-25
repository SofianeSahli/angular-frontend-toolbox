import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'button[uiFieldAction]',
  templateUrl: './field-action.html',
  styleUrl: './field-action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button' },
})
export class UiFieldAction {}
