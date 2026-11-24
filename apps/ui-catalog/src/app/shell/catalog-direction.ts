import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Direction = 'ltr' | 'rtl';

@Injectable({ providedIn: 'root' })
export class CatalogDirection {
  private readonly html = inject(DOCUMENT).documentElement;
  private readonly current = signal<Direction>(this.html.dir === 'rtl' ? 'rtl' : 'ltr');

  readonly direction = this.current.asReadonly();

  set(direction: Direction): void {
    this.current.set(direction);
    this.html.dir = direction;
  }
}
