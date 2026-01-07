import { Component, forwardRef, input, model, OnChanges, output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export interface SwitchOption {
  label: string;
  value: string;
  disabled?: boolean;
}
@Component({
  selector: 'lib-switch-buttons',
  imports: [TranslatePipe],
  templateUrl: './switch-buttons.html',
  styleUrl: './switch-buttons.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchButtons),
      multi: true
    }
  ]
})
export class SwitchButtons implements ControlValueAccessor, OnChanges {
  options = input.required<SwitchOption[]>();
  id = input<string>()
  label = input<string>('');
  value = model<string>('');
  name = input<string>('switch-buttons');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  showErrors = input<boolean>(true);
  valueChange = output<string>();
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };
  private _value: any = '';

  // Validation state
  touched = false;
  hasError = () => this.required() && !this._value && this.touched;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && changes['value'].currentValue !== this._value) {
      this._value = changes['value'].currentValue;
      this.onChange(this._value);
    }
  }

  onValueChange(value: string): void {
    this._value = value;
    this.touched = true;
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }

  getButtonClass(optionValue: string): string {
    const baseClass = 'btn-outline-primary';
    return this._value === optionValue ? `btn-primary` : baseClass;
  }

  getId(value: string): string {
    return `${value}`;
  }

  getErrorMessage(): string {
    return 'validation.required';
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this._value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input binding
  }
}
