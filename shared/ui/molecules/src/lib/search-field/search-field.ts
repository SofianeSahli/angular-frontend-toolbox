import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, linkedSignal, model, numberAttribute, viewChild } from '@angular/core';
import { UiButton, UiIcon, UiInput } from '@shared/ui-atoms';
import { UI_TEXT } from '@shared/ui-tokens';

@Component({
  selector: 'ui-search-field',
  imports: [UiInput, UiIcon, UiButton],
  template: `<ui-icon class="ui-search-field__icon" name="search" />
    <input
      #field
      uiInput
      type="search"
      class="ui-search-field__input"
      [placeholder]="placeholder() ?? ''"
      [attr.aria-label]="ariaLabel()"
      [value]="draft()"
      (input)="onType($event)"
      (keydown.escape)="clear()"
    />
    @if (draft()) {
      <button uiButton variant="ghost" size="sm" iconOnly type="button" class="ui-search-field__clear" [attr.aria-label]="text.clear" (click)="clear()">
        <ui-icon name="x" />
      </button>
    }`,
  styleUrl: './search-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSearchField {
  readonly value = model('');
  readonly placeholder = input<string>();
  readonly ariaLabel = input.required<string>();
  readonly debounce = input(250, { transform: numberAttribute });

  protected readonly text = inject(UI_TEXT);
  protected readonly draft = linkedSignal(() => this.value());
  private readonly field = viewChild.required('field', { read: ElementRef<HTMLInputElement> });
  private pendingWrite: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.pendingWrite));
  }

  protected onType(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const typed = event.target.value;
    this.draft.set(typed);
    clearTimeout(this.pendingWrite);
    this.pendingWrite = setTimeout(() => this.value.set(typed), this.debounce());
  }

  protected clear(): void {
    clearTimeout(this.pendingWrite);
    this.draft.set('');
    this.value.set('');
    this.field().nativeElement.focus();
  }
}
