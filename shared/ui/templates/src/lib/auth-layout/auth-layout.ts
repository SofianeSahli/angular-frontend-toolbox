import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-auth-layout',
  template: `<aside class="ui-auth-layout__brand"><ng-content select="[uiAuthBrand]" /></aside>
    <div class="ui-auth-layout__column">
      <div class="ui-auth-layout__toolbar"><ng-content select="[uiAuthToolbar]" /></div>
      <main class="ui-auth-layout__content">
        <div class="ui-auth-layout__panel"><ng-content /></div>
      </main>
    </div>`,
  styleUrl: './auth-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAuthLayout {}
