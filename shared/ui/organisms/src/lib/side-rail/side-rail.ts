import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-side-rail',
  templateUrl: './ui-side-rail.html',
  styleUrl: './side-rail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSideRail {
  readonly ariaLabel = input<string>();
}

@Component({
  selector: 'a[uiRailItem]',
  templateUrl: './ui-rail-item.html',
  styleUrl: './rail-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiRailItem {}

@Component({
  selector: 'ui-rail-section',
  templateUrl: './ui-rail-section.html',
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
