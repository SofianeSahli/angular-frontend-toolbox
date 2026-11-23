import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiToastRegion } from '@shared/ui-organisms';

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
})
export class UiAppShell {}
