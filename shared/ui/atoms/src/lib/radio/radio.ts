import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'input[type=radio][uiRadio]',
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiRadio {}
