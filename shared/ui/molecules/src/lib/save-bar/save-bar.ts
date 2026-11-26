import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, booleanAttribute, inject, input, output } from '@angular/core';
import { UiButton } from '@shared/ui-atoms';

const SCROLL_PADDING = 'scroll-padding-block-end';

@Component({
  selector: 'ui-save-bar',
  imports: [UiButton],
  templateUrl: './save-bar.html',
  styleUrl: './save-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSaveBar {
  readonly text = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly secondaryLabel = input.required<string>();
  readonly busy = input(false, { transform: booleanAttribute });
  readonly primary = output<void>();
  readonly secondary = output<void>();

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    const host: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => {
      const offset = Number.parseFloat(host.ownerDocument.defaultView?.getComputedStyle(host).bottom ?? '') || 0;
      root.style.setProperty(SCROLL_PADDING, `${host.offsetHeight + offset}px`);
    });
    inject(DestroyRef).onDestroy(() => root.style.removeProperty(SCROLL_PADDING));
  }
}
