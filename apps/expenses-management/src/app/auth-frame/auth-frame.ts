import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastRegion } from '@shared/ui-organisms';
import { UiAuthLayout } from '@shared/ui-templates';
import { BrandPanel } from './brand-panel';
import { LanguageSwitch } from './language-switch';

@Component({
  selector: 'app-auth-frame',
  imports: [BrandPanel, LanguageSwitch, RouterOutlet, UiAuthLayout, UiToastRegion],
  templateUrl: './auth-frame.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFrame {}
