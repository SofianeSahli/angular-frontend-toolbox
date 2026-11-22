import { Injectable, InjectionToken, Provider, inject } from '@angular/core';
import { UiIconDefinition } from './icon-definition';
import { LUCIDE_STARTER_ICONS } from './icons/lucide-starter';

type IconSet = Readonly<Record<string, UiIconDefinition>>;

export const UI_ICONS = new InjectionToken<readonly IconSet[]>('UI_ICONS');

export function provideIcons(icons: IconSet): Provider {
  return { provide: UI_ICONS, useValue: icons, multi: true };
}

@Injectable({ providedIn: 'root' })
export class UiIconRegistry {
  private readonly icons: IconSet = Object.assign({}, LUCIDE_STARTER_ICONS, ...(inject(UI_ICONS, { optional: true }) ?? []));

  find(name: string): UiIconDefinition | undefined {
    return Object.hasOwn(this.icons, name) ? this.icons[name] : undefined;
  }
}
