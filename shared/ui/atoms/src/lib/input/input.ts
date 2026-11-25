import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'input[uiInput], textarea[uiInput]',
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiInput {}
