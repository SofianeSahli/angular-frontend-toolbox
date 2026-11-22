import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'input[uiInput], textarea[uiInput]',
  template: '',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiInput {}
