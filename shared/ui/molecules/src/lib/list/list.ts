import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-list',
  template: '<ul class="ui-list__items" role="list"><ng-content /></ul>',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiList {}
