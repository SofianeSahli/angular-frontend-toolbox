import { Provider, Type, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export abstract class UiValueAccessor<V> implements ControlValueAccessor {
  protected readonly value = signal<V | null>(null);
  protected readonly isDisabled = signal(false);

  private notifyChange: (value: V | null) => void = () => undefined;
  private notifyTouched: () => void = () => undefined;

  writeValue(value: V | null): void {
    this.value.set(value);
  }

  registerOnChange(onChange: (value: V | null) => void): void {
    this.notifyChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.notifyTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  protected commit(value: V | null): void {
    this.value.set(value);
    this.notifyChange(value);
  }

  protected markTouched(): void {
    this.notifyTouched();
  }
}

export function provideValueAccessor(component: () => Type<unknown>): Provider {
  return { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(component), multi: true };
}
