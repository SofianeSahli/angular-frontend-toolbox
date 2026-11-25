import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-list',
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiList {}
