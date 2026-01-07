import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GeneralQuery } from '@shared/stores';
import { DateInputComponent, DynamicComponentInterface, SelectComponent, SwitchButtons, SwitchOption, TextInput } from '@shared/ui-components';
import { Categorie } from 'apps/expenses-management/src/models/Categorie.model';
import { categoriesStore } from 'apps/expenses-management/src/stores/categories.signal';
import { moneyTransitionSignalStore } from '../state/money-transitions/money-transition.signal';

@Component({
  selector: 'app-filter',
  imports: [ReactiveFormsModule, SelectComponent, DateInputComponent, SwitchButtons, TextInput],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Filter implements DynamicComponentInterface<void> {
  activeModal?: NgbActiveModal = inject(NgbActiveModal);
  done: OutputEmitterRef<void> = output();
  loading?: boolean = false;
  TYPE_OPTIONS: Array<SwitchOption> = [
    {
      label: 'labels.incomes',
      value: '1'
    }, {
      label: 'labels.expenses',
      value: '0'
    }
  ]
  form = new FormGroup({
    type: new FormControl(''),
    categorie: new FormControl(''),
    categorie_id: new FormControl(''),
    max_amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
    min_amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
    start_date: new FormControl(''),
    end_date: new FormControl(''),
  });
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
  typeValue = toSignal(this.form.get('type')!.valueChanges, { initialValue: '' });

  categorieValue = toSignal(this.form.get('categorie')!.valueChanges, { initialValue: '' });

  categoriesStore = inject(categoriesStore);
  moneyTransitionSignal = inject(moneyTransitionSignalStore);

  constructor() {
    effect(() => {

    });
  }

  submit() {
    this.moneyTransitionSignal.resesetQuery(this.form.getRawValue() as GeneralQuery);
    this.moneyTransitionSignal.reset();
    this.moneyTransitionSignal.load(this.moneyTransitionSignal.query());
  }
}
