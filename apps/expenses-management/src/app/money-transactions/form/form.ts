import {
  Component,
  computed,
  effect,
  inject,
  output,
  OutputEmitterRef
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DateInputComponent, DynamicComponentInterface, Loader, SelectComponent, SwitchButtons, SwitchOption, TextInput } from '@shared/ui-components';
import { Categorie } from 'apps/expenses-management/src/models/Categorie.model';
import { categoriesStore } from '../../../stores/categories.signal';
import { moneyTransitionSignalStore } from '../state/money-transitions/money-transition.signal';
import { MoneyTransition } from '../state/money-transitions/MoneyTransition.model';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Loader, SwitchButtons, SelectComponent, TextInput, DateInputComponent
  ],
  templateUrl: './form.html',
  styleUrls: ['./form.scss'],
})
export class Form implements DynamicComponentInterface<void> {
  [key: string]: any;

  TYPE_OPTIONS: Array<SwitchOption> = [
    {
      label: 'labels.incomes',
      value: '1'
    }, {
      label: 'labels.expenses',
      value: '0'
    }
  ]
  OCCUREN_OPTIONS: Array<SwitchOption> = [
    {
      label: 'labels.one_time',
      value: 'one_time'
    }, {
      label: 'labels.weekly',
      value: 'weekly'
    }, {
      label: 'labels.monthly',
      value: 'monthly'
    }, {
      label: 'labels.yearly',
      value: 'yearly'
    }
  ]
  activeModal?: NgbActiveModal = inject(NgbActiveModal);
  done: OutputEmitterRef<void> = output();
  categoriesStore = inject(categoriesStore);
  moneyTransitionStore = inject(moneyTransitionSignalStore);
  loading?: boolean = this.moneyTransitionStore.isLoading();
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  form = new FormGroup({
    type: new FormControl('', Validators.required),
    categorie: new FormControl('', Validators.required),
    categorie_id: new FormControl('', Validators.required),
    amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
    description: new FormControl('', Validators.required),
    occurence: new FormControl('one_time'),
    date: new FormControl(''),
    start_date: new FormControl(''),
    end_date: new FormControl(''),
  }, { validators: this.dateRangeValidator() });

  showAmount = computed(() => !!this.form.get('categorie_id')?.value);
  showDescription = computed(() => !!this.form.get('amount')?.value);
  typeValue = toSignal(this.form.get('type')!.valueChanges, { initialValue: '' });
  categorieValue = toSignal(this.form.get('categorie')!.valueChanges, { initialValue: '' });
  categorieIdValue = toSignal(this.form.get('categorie_id')!.valueChanges, { initialValue: '' });
  occurenceValue = toSignal(this.form.get('occurence')!.valueChanges, { initialValue: 'one_time' });
  filteredCategories = computed(() => {
    const type = this.typeValue()
    if (!type) return [];
    return this.categoriesStore
      .entities()
      .filter((c: Categorie) => c.is_income.toString() == type)
      .map((c: Categorie) => ({
        value: c.id,
        label: c.name,
      }));
  });

  childCategories = computed(() => {
    const categorieId = this.categorieValue();
    if (!categorieId) return [];
    const category = this.categoriesStore.entityMap()[categorieId];
    return category?.children?.map((cate: Categorie) => ({
      label: cate.name,
      value: cate.id,
    })) || [];
  });

  private dateRangeValidator(): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      const occurence = form.get('occurence')?.value;
      const date = form.get('date')?.value;
      const start_date = form.get('start_date')?.value;
      const end_date = form.get('end_date')?.value;

      const errors: ValidationErrors = {};

      switch (occurence) {
        case 'one_time':
          if (!date) {
            errors['dateRequired'] = 'Date is required for one-time events';
          }
          break;

        case 'weekly':
        case 'monthly':
        case 'yearly':
          if (!start_date) {
            errors['startDateRequired'] = 'Start date is required for recurring events';
          }
          if (!end_date) {
            errors['endDateRequired'] = 'End date is required for recurring events';
          }
          break;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  constructor() {
    effect(() => {
      if (this.typeValue() == '0' || this.typeValue() == '1') {
        this.onTypeChange()
      }

      if (this.moneyTransitionStore.isItemCreated()) {
        this.moneyTransitionStore.setItemCreated(false);
        this.done.emit();
        this.form.reset();
      }
    });
  }

  submit() {
    if (this.form.valid) {
      this.moneyTransitionStore.addItem(this.form.value as Partial<MoneyTransition>);
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onTypeChange(): void {
    this.form.get('categorie')?.setValue('');
    this.form.get('categorie_id')?.setValue('');
  }


}