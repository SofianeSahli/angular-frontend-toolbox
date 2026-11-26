import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAmount, UiButton, UiIcon, UiInput } from '@shared/ui-atoms';
import { UiFormField, UiStat } from '@shared/ui-molecules';
import { UiBottomTabs, UiRailItem, UiSideRail, UiTab, UiTabAction, UiTopBar } from '@shared/ui-organisms';
import { UiAppShell, UiAuthLayout, UiFlowLayout, UiPage, UiPageAside } from '@shared/ui-templates';
import { CatalogToolbar } from '../../../shell/catalog-toolbar/catalog-toolbar';

@Component({
  selector: 'app-app-shell-demo',
  imports: [UiAppShell, UiSideRail, UiRailItem, UiTopBar, UiBottomTabs, UiTab, UiTabAction, UiPage, UiStat, UiAmount, UiButton, UiIcon, CatalogToolbar],
  templateUrl: './app-shell-demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellDemo {}

@Component({
  selector: 'app-page-demo',
  imports: [UiPage, UiPageAside, UiButton, CatalogToolbar],
  templateUrl: './page-demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageDemo {}

@Component({
  selector: 'app-auth-demo',
  imports: [UiAuthLayout, UiFormField, UiInput, UiButton, CatalogToolbar],
  templateUrl: './auth-demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthDemo {}

@Component({
  selector: 'app-flow-demo',
  imports: [UiFlowLayout, UiFormField, UiInput, UiButton, CatalogToolbar],
  templateUrl: './flow-demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowDemo {}
