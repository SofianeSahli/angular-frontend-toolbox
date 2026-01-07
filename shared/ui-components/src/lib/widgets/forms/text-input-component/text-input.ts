import { Component, forwardRef, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'lib-text-input',
  imports: [TranslatePipe],
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true
    }
  ]
})
export class TextInput implements ControlValueAccessor, OnChanges {
  label = input<string>('');
  placeholder = input<string>('');
  id = input<string>('input');
  name = input<string>('input');
  type = input<string>('text');
  multiline = input<boolean>(false);
  rows = input<number>(3);
  cols = input<number>();
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  showErrors = input<boolean>(true);
  showValid = input<boolean>(false);
  formControl = input<AbstractControl | null>();
  inputClass = input<string>('form-control');
  helpText = input<string>('');
  step = input<string | number>('');
  min = input<string | number>('');
  max = input<string | number>('');
  valueChange = output<any>();
  focused = output<void>();
  autocomplete = input('')
  protected _value: any = '';
  private _onChange: (value: any) => void = () => { };
  private _onTouched: () => void = () => { };
  private _touched = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] && this.type() === 'number') {
      if (this._value !== '' && this._value !== null && this._value !== undefined) {
        this._value = Number(this._value);
        this._onChange(this._value);
      }
    }
  }

  hasError = () => {
    const control = this.formControl();
    if (control && control.touched && control.invalid) {
      return true;
    }
    return this.required() && !this.hasValue() && this._touched;
  };

  isValid = () => this.hasValue() && !this.hasError();
  hasValue = () => {
    return this._value !== '' && this._value !== null && this._value !== undefined;
  };

  onInputChange(event: Event): void {
    const element = event.target as HTMLInputElement | HTMLTextAreaElement;
    let newValue: any = element.value;
    if (this.type() === 'number' && newValue !== '') {
      const numValue = Number(newValue);
      newValue = isNaN(numValue) ? newValue : numValue;
    }
    this._value = newValue;
    this._onChange(newValue);
    this.valueChange.emit(newValue);
  }

  onBlur(): void {
    this._touched = true;
    this._onTouched();
  }

  onFocus(): void {
    this.focused.emit();
  }

  getErrorMessage(): string {
    const control = this.formControl();

    if (!control || !control.errors || !this._touched) {

      return 'validation.required';
    }

    const errors = control.errors;
    const errorPriority = [
      'required',
      'email',
      'minlength',
      'maxlength',
      'min',
      'max',
      'pattern',
      'invalidUsername',
      'passwordMismatch'
    ];

    for (const errorKey of errorPriority) {

      if (errors[errorKey]) {
        const error = errors[errorKey];

        if (typeof error === 'object' && error.message) {
          return error.message;
        }
        const messageMap: { [key: string]: string } = {
          'required': 'validation.required',
          'email': 'validation.email_invalid',
          'minlength': `validation.min_length_${error.requiredLength}`,
          'maxlength': `validation.max_length_${error.requiredLength}`,
          'min': `validation.min_value_${error.min}`,
          'max': `validation.max_value_${error.max}`,
          'pattern': 'validation.invalid_pattern',
          'invalidUsername': 'validation.invalid_username',
          'passwordMismatch': 'validation.password_mismatch',
        };
        return messageMap[errorKey] || 'validation.invalid';
      }
    }

    return 'validation.invalid';
  }

  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this._value = '';
    } else {
      this._value = value;
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input binding
  }
}