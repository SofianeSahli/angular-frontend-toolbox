import { CdkMenu, CdkMenuItem, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, inject, input } from '@angular/core';
import { UiIcon } from '@shared/ui-atoms';

const BELOW_START_THEN_FLIP: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

@Directive({
  selector: '[uiMenuTriggerFor]',
  hostDirectives: [{ directive: CdkMenuTrigger, inputs: ['cdkMenuTriggerFor: uiMenuTriggerFor', 'cdkMenuTriggerData: uiMenuTriggerData'] }],
})
export class UiMenuTrigger {
  constructor() {
    inject(CdkMenuTrigger, { self: true }).menuPosition = BELOW_START_THEN_FLIP;
  }
}

@Component({
  selector: 'ui-menu',
  templateUrl: './ui-menu.html',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [CdkMenu],
})
export class UiMenu {}

@Component({
  selector: 'button[uiMenuItem]:not([checked])',
  imports: [UiIcon],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CdkMenuItem, inputs: ['cdkMenuItemDisabled: disabled'], outputs: ['cdkMenuItemTriggered: triggered'] }],
  host: {
    type: 'button',
    '[class.ui-menu-item--danger]': 'danger()',
  },
})
export class UiMenuItem {
  readonly icon = input<string>();
  readonly danger = input(false, { transform: booleanAttribute });
}

@Component({
  selector: 'button[uiMenuItem][checked]',
  imports: [UiIcon],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItemRadio,
      inputs: ['cdkMenuItemChecked: checked', 'cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: { type: 'button' },
})
export class UiMenuItemRadio {
  readonly icon = input<string>();
}
