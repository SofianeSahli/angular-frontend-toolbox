import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MoneyTransition } from '../state/money-transitions/MoneyTransition.model';

@Component({
  selector: 'app-list-items',
  imports: [DatePipe, TranslatePipe, CurrencyPipe],
  templateUrl: './list-items.html',
  styleUrl: './list-items.scss',
})
export class ListItems {
  moneyTransition = input.required<MoneyTransition>();
}
