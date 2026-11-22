import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'input[type=radio][uiRadio]',
  template: '',
  styleUrl: './radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiRadio {}
