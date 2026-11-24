import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastRegion } from '@shared/ui-organisms';
import { UiAuthLayout } from '@shared/ui-templates';
import { BrandPanel } from './brand-panel';
import { LanguageSwitch } from './language-switch';

@Component({
  selector: 'app-auth-frame',
  imports: [BrandPanel, LanguageSwitch, RouterOutlet, UiAuthLayout, UiToastRegion],
  template: `<ui-auth-layout>
      <app-brand-panel uiAuthBrand />
      <app-language-switch uiAuthToolbar />
      <router-outlet />
    </ui-auth-layout>
    <ui-toast-region />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFrame {}
