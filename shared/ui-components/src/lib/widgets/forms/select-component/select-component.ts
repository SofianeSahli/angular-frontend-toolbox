import { Component, forwardRef, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SwitchOption } from '../switch-buttons/switch-buttons';

@Component({
  selector: 'lib-select',
  imports: [TranslatePipe],
  templateUrl: './select-component.html',
  styleUrl: './select-component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }]
})
export class SelectComponent implements ControlValueAccessor, OnChanges {
  label = input<string>('');
  options = input<SwitchOption[]>([]);
  placeholder = input<string>('');
  id = input<string>('select');
  name = input<string>('select');
  multiple = input<boolean>(false);
  size = input<number>(4);
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  showErrors = input<boolean>(true);
  showValid = input<boolean>(false);
  showEmptyState = input<boolean>(true);
  emptyStateText = input<string>('messages.no_options');
  selectClass = input<string>('form-select');
  valueChange = output<any>();
  touched = output<void>();
  _value: string | Array<string> = this.multiple() ? [] : '';
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };
  private _touched = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['multiple'] && changes['multiple'].currentValue !== changes['multiple'].previousValue) {
      // Reset value when multiple mode changes
      this._value = this.multiple() ? [] : '';
      this.onChange(this._value);
    }
  }

  // Computed properties
  selectedCount = () => {
    if (!this.multiple() || !Array.isArray(this._value)) return 0;
    return this._value.length;
  };

  hasError = () => this.required() && !this.hasValue() && this._touched;
  isValid = () => this.hasValue() && !this.hasError();
  hasValue = () => {
    if (this.multiple()) {
      return Array.isArray(this._value) && this._value.length > 0;
    }
    return !!this._value;
  };
  trackByValue = (value: string) => value;

  isSelected(value: string): boolean {
    if (this.multiple()) {
      return Array.isArray(this._value) && this._value.includes(value);
    }
    return this._value === value;
  }

  onValueChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    if (this.multiple()) {
      const selectedOptions = Array.from(select.selectedOptions);
      this._value = selectedOptions.map(option => option.value);
    } else {
      this._value = select.value;
    }

    this.onChange(this._value);
    this.valueChange.emit(this._value);
  }

  onBlur(): void {
    this._touched = true;
    this.onTouched();
    this.touched.emit();
  }

  getErrorMessage(): string {
    if (this.required() && !this.hasValue()) {
      return 'validation.required';
    }
    return 'validation.invalid';
  }

  writeValue(value: string | Array<string>): void {
    if (this.multiple()) {
      this._value = Array.isArray(value) ? value : [];
    } else {
      this._value = value || '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }


}