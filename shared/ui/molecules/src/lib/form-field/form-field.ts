import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { NgControl, ValidationErrors } from '@angular/forms';
import { UiFieldMessage, UiInput, UiLabel, UiSelect } from '@shared/ui-atoms';
import { UI_TEXT, fillUiText } from '@shared/ui-tokens';
import { UiFieldAction } from './field-action';
import { UiFieldAffix } from './field-affix';

interface ControlState {
  readonly value: unknown;
  readonly invalid: boolean;
  readonly touched: boolean;
  readonly errors: ValidationErrors | null;
}

const NO_CONTROL_STATE: ControlState = { value: null, invalid: false, touched: false, errors: null };
const LEFT_TO_RIGHT_TYPES = new Set(['tel', 'email']);

let nextFieldId = 0;

function errorValues(error: unknown): Record<string, string | number> {
  if (typeof error !== 'object' || error === null) return {};
  return Object.fromEntries(
    Object.entries(error).filter((entry): entry is [string, string | number] => typeof entry[1] === 'string' || typeof entry[1] === 'number'),
  );
}

@Component({
  selector: 'ui-form-field',
  imports: [UiLabel, UiFieldMessage],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-form-field--has-prefix]': 'hasPrefix()',
    '[class.ui-form-field--has-suffix]': 'hasSuffix()',
    '[class.ui-form-field--has-action]': '!!action()',
    '(input)': 'rememberTypedValue($event)',
  },
})
export class UiFormField {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly optional = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly maxLength = input<number | undefined, unknown>(undefined, { transform: (value) => (value == null ? undefined : numberAttribute(value)) });
  readonly errors = input<Readonly<Record<string, string>>>({});

  private readonly text = inject(UI_TEXT);
  private readonly fieldId = `ui-form-field-${nextFieldId++}`;
  protected readonly hintId = `${this.fieldId}-hint`;
  protected readonly errorId = `${this.fieldId}-error`;

  private readonly ngControl = contentChild(NgControl);
  private readonly inputElement = contentChild(UiInput, { read: ElementRef });
  private readonly selectElement = contentChild(UiSelect, { read: ElementRef });
  protected readonly affixes = contentChildren(UiFieldAffix);
  protected readonly action = contentChild(UiFieldAction);

  private readonly controlState = signal<ControlState>(NO_CONTROL_STATE);
  protected readonly typedValue = signal('');

  private readonly controlElement = computed<HTMLElement | undefined>(() => (this.inputElement() ?? this.selectElement())?.nativeElement);
  protected readonly controlId = computed(() => this.controlElement()?.id || `${this.fieldId}-control`);
  protected readonly hasPrefix = computed(() => this.affixes().some((affix) => affix.element.hasAttribute('uiPrefix')));
  protected readonly hasSuffix = computed(() => this.affixes().some((affix) => affix.element.hasAttribute('uiSuffix')));

  protected readonly errorText = computed(() => {
    const state = this.controlState();
    if (!state.touched || !state.invalid || !state.errors) return null;
    const [key, error] = Object.entries(state.errors)[0] ?? [];
    if (!key) return null;
    const template = this.errors()[key] ?? this.text.errors[key] ?? this.text.errors.pattern;
    return fillUiText(template, errorValues(error));
  });

  protected readonly length = computed(() => {
    const value = this.ngControl() ? this.controlState().value : this.typedValue();
    return value == null ? 0 : String(value).length;
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.ngControl()?.control;
      if (!control) return;
      const read = () =>
        this.controlState.set({ value: control.value, invalid: control.invalid, touched: control.touched, errors: control.errors });
      read();
      const subscription = control.events.subscribe(read);
      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      const element = this.controlElement();
      if (!element) return;
      element.id = this.controlId();
      const describedBy = this.errorText() ? this.errorId : this.hint() ? this.hintId : null;
      this.setOrRemove(element, 'aria-describedby', describedBy);
      this.setOrRemove(element, 'aria-invalid', this.errorText() ? 'true' : null);
      if (LEFT_TO_RIGHT_TYPES.has(element.getAttribute('type') ?? '')) {
        element.dir = 'ltr';
        for (const affix of this.affixes()) affix.element.dir = 'ltr';
      }
    });
  }

  protected rememberTypedValue(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) this.typedValue.set(target.value);
  }

  private setOrRemove(element: HTMLElement, attribute: string, value: string | null): void {
    if (value === null) element.removeAttribute(attribute);
    else element.setAttribute(attribute, value);
  }
}
