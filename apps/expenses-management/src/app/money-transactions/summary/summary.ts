import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { routeAnimations, SwitchButtons } from '@shared/ui-components';
import { withSummary } from '../state/summary/summary.signals';
import { BarChart } from './bar-chart/bar-chart';
import { ChartItem } from "./charts/chart-item";
import { DateRange } from './date-range-filter/date-range';
import { SummaryItem } from './summary-item/summary-item';

@Component({
  selector: 'app-summary',
  imports: [SummaryItem, ChartItem, SwitchButtons, DateRange, BarChart],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
  animations: [routeAnimations]
})
export class Summary {
  tabOptions = [
    {
      label: 'labels.show_summary',
      value: 'labels.show_summary'
    },
    {
      label: 'labels.show_pie_chart',
      value: 'labels.show_pie_chart'
    },
    {
      label: 'labels.show_bar_chart',
      value: 'labels.show_bar_chart'
    }
  ]
  summarySignal = inject(withSummary);
  router = inject(Router)
  translate = inject(TranslateService)
  showingItem = signal<'labels.show_summary' | 'labels.show_pie_chart' |
    'labels.show_bar_chart'>('labels.show_summary')


  changeView($event: string) {
    //@ts-expect-error string missmatch 
    this.showingItem = $event

  }
}
