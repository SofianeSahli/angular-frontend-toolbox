import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { mediaQueryDown } from '@shared/ui-tokens';
import { UiToast } from './toast.service';
import { UiToastView } from './toast-view';

const VISIBLE_ON_PHONES = 1;
const VISIBLE_ON_DESKTOP = 3;

@Component({
  selector: 'ui-toast-region',
  imports: [UiToastView],
  template: `@for (toast of visibleToasts(); track toast.id) {
    <ui-toast [toast]="toast" />
  }`,
  styleUrl: './toast-region.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiToastRegion {
  private readonly service = inject(UiToast);
  private readonly phoneQuery = inject(DOCUMENT).defaultView?.matchMedia?.(mediaQueryDown('medium')) ?? null;
  private readonly onPhone = signal(this.phoneQuery?.matches ?? false);

  protected readonly visibleToasts = computed(() => this.service.toasts().slice(-(this.onPhone() ? VISIBLE_ON_PHONES : VISIBLE_ON_DESKTOP)));

  constructor() {
    const follow = (event: MediaQueryListEvent) => this.onPhone.set(event.matches);
    this.phoneQuery?.addEventListener?.('change', follow);
    inject(DestroyRef).onDestroy(() => this.phoneQuery?.removeEventListener?.('change', follow));
  }
}
