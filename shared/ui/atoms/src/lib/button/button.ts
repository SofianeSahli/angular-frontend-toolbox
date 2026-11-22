import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import { UiSpinner } from '../spinner/spinner';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

function hasAccessibleName(element: HTMLElement): boolean {
  return ['aria-label', 'aria-labelledby', 'title'].some((attribute) => !!element.getAttribute(attribute)?.trim());
}

@Component({
  selector: 'button[uiButton], a[uiButton]',
  imports: [UiSpinner],
  template: `@if (loading()) {
      <ui-spinner aria-hidden="true" />
    }
    <ng-content />`,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-button--primary]': 'variant() === "primary"',
    '[class.ui-button--ghost]': 'variant() === "ghost"',
    '[class.ui-button--danger]': 'variant() === "danger"',
    '[class.ui-button--sm]': 'size() === "sm"',
    '[class.ui-button--lg]': 'size() === "lg"',
    '[class.ui-button--icon-only]': 'iconOnly()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': '!isNativeButton && disabled() ? "true" : null',
    '[attr.tabindex]': '!isNativeButton && disabled() ? "-1" : null',
  },
})
export class UiButton {
  readonly variant = input<UiButtonVariant>('secondary');
  readonly size = input<UiButtonSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly isNativeButton = this.element.tagName === 'BUTTON';

  constructor() {
    const blockActivation = (event: Event) => {
      if (!this.loading() && !(this.disabled() && !this.isNativeButton)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    this.element.addEventListener('click', blockActivation, { capture: true });
    inject(DestroyRef).onDestroy(() => this.element.removeEventListener('click', blockActivation, { capture: true }));

    afterNextRender(() => {
      if (isDevMode() && this.iconOnly() && !hasAccessibleName(this.element)) {
        console.error('uiButton: an icon-only button needs an aria-label', this.element);
      }
    });
  }
}
