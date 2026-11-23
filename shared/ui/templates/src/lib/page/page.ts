import { ChangeDetectionStrategy, Component, Directive, contentChild, input } from '@angular/core';

@Directive({ selector: '[uiPageAside]' })
export class UiPageAside {}

@Component({
  selector: 'ui-page',
  template: `<header class="ui-page__header">
      <div>
        @if (eyebrow(); as eyebrowText) {
          <p class="ui-page__eyebrow">{{ eyebrowText }}</p>
        }
        <h1 class="ui-page__title">{{ title() }}</h1>
      </div>
      <div class="ui-page__actions"><ng-content select="[uiPageActions]" /></div>
    </header>
    <div class="ui-page__columns">
      <div class="ui-page__content"><ng-content /></div>
      @if (aside()) {
        <aside class="ui-page__aside"><ng-content select="[uiPageAside]" /></aside>
      }
    </div>`,
  styleUrl: './page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-page--with-aside]': '!!aside()',
  },
})
export class UiPage {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();

  protected readonly aside = contentChild(UiPageAside);
}
