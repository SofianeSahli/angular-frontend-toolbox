import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-side-rail',
  template: `<div class="ui-side-rail__brand"><ng-content select="[uiRailBrand]" /></div>
    <div class="ui-side-rail__action"><ng-content select="[uiRailAction]" /></div>
    <nav class="ui-side-rail__nav" [attr.aria-label]="ariaLabel()"><ng-content /></nav>
    <div class="ui-side-rail__footer"><ng-content select="[uiRailFooter]" /></div>`,
  styleUrl: './side-rail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSideRail {
  readonly ariaLabel = input<string>();
}

@Component({
  selector: 'a[uiRailItem]',
  template: '<ng-content />',
  styleUrl: './rail-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiRailItem {}

@Component({
  selector: 'ui-rail-section',
  template: `<p class="ui-rail-section__label">{{ label() }}</p>
    <ng-content />`,
  styleUrl: './rail-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
})
export class UiRailSection {
  readonly label = input.required<string>();
}
