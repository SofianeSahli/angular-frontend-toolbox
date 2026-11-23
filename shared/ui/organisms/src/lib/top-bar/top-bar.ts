import { ChangeDetectionStrategy, Component, Directive, contentChild, input } from '@angular/core';

export type UiTopBarAlign = 'center' | 'start';

@Directive({ selector: '[uiTopBarTitle]' })
export class UiTopBarTitle {}

@Component({
  selector: 'ui-top-bar',
  template: `<div class="ui-top-bar__leading"><ng-content select="[uiTopBarLeading]" /></div>
    @if (customTitle()) {
      <div class="ui-top-bar__title"><ng-content select="[uiTopBarTitle]" /></div>
    } @else {
      <h1 class="ui-top-bar__title">{{ title() }}</h1>
    }
    <div class="ui-top-bar__trailing"><ng-content select="[uiTopBarTrailing]" /></div>`,
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
    '[class.ui-top-bar--start]': 'align() === "start"',
  },
})
export class UiTopBar {
  readonly title = input<string>('');
  readonly align = input<UiTopBarAlign>('center');

  protected readonly customTitle = contentChild(UiTopBarTitle);
}
