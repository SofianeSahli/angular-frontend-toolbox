import { ChangeDetectionStrategy, Component, Directive, contentChild, input } from '@angular/core';

@Directive({ selector: '[uiPageAside]' })
export class UiPageAside {}

@Component({
  selector: 'ui-page',
  templateUrl: './page.html',
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
