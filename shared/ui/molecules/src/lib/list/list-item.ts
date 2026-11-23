import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'li[uiListItem], a[uiListItem], button[uiListItem]',
  template: `<span class="ui-list-item__leading"><ng-content select="[uiLeading]" /></span>
    <span class="ui-list-item__body">
      <span class="ui-list-item__title"><ng-content select="[uiTitle]" /></span>
      <span class="ui-list-item__subtitle"><ng-content select="[uiSubtitle]" /></span>
    </span>
    <span class="ui-list-item__trailing"><ng-content select="[uiTrailing]" /></span>`,
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiListItem {}
