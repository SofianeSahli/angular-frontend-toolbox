import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-summary-item',
  imports: [TranslatePipe, CurrencyPipe],
  templateUrl: './summary-item.html',
  styleUrl: './summary-item.scss',
})
export class SummaryItem {
  moneyAmount = input.required<number>()
  moneyEntriescount = input.required<number>()
  lineType = input.required<'income' | 'expense' | 'saving'>()

  bgColor = computed(() => {
    switch (this.lineType()) {
      case 'income':
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim();
      case 'expense':
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-danger').trim();
      case 'saving':
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-warning').trim();
      default:


        return 'transparent';
    }
  });

  getSummaryLabels() {
    switch (this.lineType()) {
      case 'expense':
        return {
          titleKey: 'text.summary_expenses',
          amountKey: 'labels.total_expenses_amount',
          entriesKey: 'labels.number_expenses_entries',
        };

      case 'income':
        return {
          titleKey: 'text.summary_income',
          amountKey: 'labels.total_income_amount',
          entriesKey: 'labels.number_income_entries',
        };

      case 'saving':
        return {
          titleKey: 'text.summary_savings',
          amountKey: 'labels.total_savings_amount',
          entriesKey: 'labels.number_savings_entries',
        };
    }
  }

}