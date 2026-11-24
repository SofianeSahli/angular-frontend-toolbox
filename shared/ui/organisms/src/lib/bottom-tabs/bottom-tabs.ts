import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-bottom-tabs',
  template: '<nav class="ui-bottom-tabs__nav" [attr.aria-label]="ariaLabel()"><ng-content /></nav>',
  styleUrl: './bottom-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBottomTabs {
  readonly ariaLabel = input<string>();
}

@Component({
  selector: 'a[uiTab]',
  template: '<ng-content />',
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTab {}

@Component({
  selector: 'button[uiTabAction]',
  template: '<ng-content />',
  styleUrl: './tab-action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button' },
})
export class UiTabAction {}
