import { ChangeDetectionStrategy, Component, contentChild } from '@angular/core';
import { UiTabAction, UiToastRegion } from '@shared/ui-organisms';

@Component({
  selector: 'ui-app-shell',
  imports: [UiToastRegion],
  template: `<div class="ui-app-shell__rail"><ng-content select="[uiShellRail]" /></div>
    <div class="ui-app-shell__column">
      <div class="ui-app-shell__top"><ng-content select="[uiShellTop]" /></div>
      <main class="ui-app-shell__main"><ng-content /></main>
      <div class="ui-app-shell__tabs"><ng-content select="[uiShellTabs]" /></div>
    </div>
    <ui-toast-region />`,
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.ui-app-shell--tab-action]': 'tabAction() !== undefined' },
})
export class UiAppShell {
  protected readonly tabAction = contentChild(UiTabAction);
}
