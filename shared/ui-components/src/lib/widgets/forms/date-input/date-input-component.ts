import { AfterViewInit, Component, ElementRef, effect, forwardRef, inject, input, output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'lib-date-input',
  imports: [TranslatePipe],
  templateUrl: './date-input-component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true
    }
  ]
})
export class DateInputComponent implements ControlValueAccessor, AfterViewInit {
  // Inputs de base
  label = input<string>('');
  placeholder = input<string>('Select a date');
  id = input<string>('');
  name = input<string>('date-input');
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  showErrors = input<boolean>(true);
  showValid = input<boolean>(false);
  helpText = input<string>('');
  minDate = input<string>('');
  maxDate = input<string>('');
  compareDate = input<string>('');
  compareType = input<'before' | 'after'>('before');
  formControl = input<AbstractControl | null>();
  valueChange = output<any>();
  focused = output<void>();

  protected _value: any = '';
  private _onChange: (value: any) => void = () => { };
  private _onTouched: () => void = () => { };
  private _touched = false;
  private elementRef = inject(ElementRef);
  private inputElement: HTMLInputElement | null = null;

  constructor() {
    effect(() => {
      this.updateInputAttributes();
    });
  }

  ngAfterViewInit(): void {
    this.inputElement = this.elementRef.nativeElement.querySelector('input[type="date"]');
    this.setupInputListener();
    this.updateInputAttributes();
  }



  private setupInputListener(): void {
    if (!this.inputElement) return;

    this.inputElement.addEventListener('input', (event: Event) => {
      this.onInputChange(event);
    });

    this.inputElement.addEventListener('blur', () => {
      this.onBlur();
    });

    this.inputElement.addEventListener('focus', () => {
      this.onFocus();
    });
  }

  private updateInputAttributes(): void {
    if (!this.inputElement) return;

    // Mettre à jour les attributs min/max
    if (this.minDate()) {
      this.inputElement.setAttribute('min', this.minDate());
    } else {
      this.inputElement.removeAttribute('min');
    }

    if (this.maxDate()) {
      this.inputElement.setAttribute('max', this.maxDate());
    } else {
      this.inputElement.removeAttribute('max');
    }
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._value = value;
    this._onChange(value);
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this._touched = true;
    this._onTouched();
  }

  onFocus(): void {
    this.focused.emit();
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

  getErrorMessage(): string {
    const control = this.formControl();

    if (control && control.errors && this._touched) {
      const errors = control.errors;

      if (errors['required']) {
        return 'validation.required';
      }

      if (errors['minDate']) {
        return 'validation.date_too_early';
      }

      if (errors['maxDate']) {
        return 'validation.date_too_late';
      }

      if (errors['invalidDateRange']) {
        return errors['invalidDateRange'].message || 'validation.invalid_date_range';
      }
    }

    if (this.required() && !this.hasValue()) {
      return 'validation.required';
    }

    return 'validation.invalid_date';
  }

  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this._value = '';
    } else {
      // Formater la date pour l'input type="date" (YYYY-MM-DD)
      if (value instanceof Date) {
        this._value = value.toISOString().split('T')[0];
      } else if (typeof value === 'string') {
        // S'assurer que c'est au format YYYY-MM-DD
        this._value = value.split('T')[0];
      } else {
        this._value = value;
      }
    }

    if (this.inputElement) {
      this.inputElement.value = this._value;
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.inputElement) {
      if (isDisabled) {
        this.inputElement.setAttribute('disabled', 'true');
      } else {
        this.inputElement.removeAttribute('disabled');
      }
    }
  }
}