import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'input[type=checkbox][uiSwitch]',
  template: '',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'switch',
  },
})
export class UiSwitch {}
