import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MoneyTransition } from '../state/money-transitions/MoneyTransition.model';

@Component({
  selector: 'app-list-items',
  imports: [DatePipe, TranslatePipe, CurrencyPipe],
  templateUrl: './list-items.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './list-items.scss',
})
export class ListItems {
  moneyTransition = input.required<MoneyTransition>();

  // Same results as the template's former `is_income == 0` / `== 1` checks,
  // for every shape the API may send (0/1, "0"/"1", true/false, null).
  isExpense = computed(() => {
    const value: unknown = this.moneyTransition().categorie.is_income;
    return value !== null && Number(value) === 0;
  });
  isIncome = computed(() => Number(this.moneyTransition().categorie.is_income) === 1);
}
