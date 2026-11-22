import { ChangeDetectionStrategy, Component, booleanAttribute, computed, effect, inject, input, isDevMode, numberAttribute } from '@angular/core';
import { UiIconSize } from './icon-definition';
import { UiIconRegistry } from './icon-registry';

@Component({
  selector: 'ui-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-icon--16]': 'size() === 16',
    '[class.ui-icon--24]': 'size() === 24',
    '[class.ui-icon--tile]': 'tile()',
    '[class.ui-icon--directional]': 'definition()?.directional === true',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
  },
})
export class UiIcon {
  readonly name = input.required<string>();
  readonly size = input<UiIconSize, unknown>(20, { transform: (value) => numberAttribute(value, 20) as UiIconSize });
  readonly tile = input(false, { transform: booleanAttribute });
  readonly label = input<string>();

  protected readonly definition = computed(() => this.registry.find(this.name()));

  private readonly registry = inject(UiIconRegistry);

  constructor() {
    effect(() => {
      if (isDevMode() && !this.definition()) console.error(`ui-icon: no icon is registered under "${this.name()}"`);
    });
  }
}
