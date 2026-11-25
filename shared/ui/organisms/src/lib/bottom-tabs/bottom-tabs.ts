import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-bottom-tabs',
  templateUrl: './ui-bottom-tabs.html',
  styleUrl: './bottom-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBottomTabs {
  readonly ariaLabel = input<string>();
}

@Component({
  selector: 'a[uiTab]',
  templateUrl: './ui-tab.html',
  styleUrl: './tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTab {}

@Component({
  selector: 'button[uiTabAction]',
  templateUrl: './ui-tab-action.html',
  styleUrl: './tab-action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button' },
})
export class UiTabAction {}
