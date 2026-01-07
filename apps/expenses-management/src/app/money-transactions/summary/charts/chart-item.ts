import { Component, effect, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';

@Component({
  selector: 'app-chart-item',
  imports: [],
  templateUrl: './chart-item.html',
  styleUrl: './chart-item.scss',
})
export class ChartItem {
  values = input.required<Array<number>>();
  private chart!: Chart;
  translateServie = inject(TranslateService)
  pieChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: this.translateServie.instant('labels.global_summary')
      },
      tooltip: {
        mode: 'index',
        intersect: false,

      }
    },

  };
  constructor() {
    effect(() => {
      if (this.values()) {
        this.updateChart()
      }
    });
  }

  updateChart() {
    const colors = [
      getComputedStyle(document.documentElement).getPropertyValue('--bs-success').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--bs-danger').trim(),
      getComputedStyle(document.documentElement).getPropertyValue('--bs-warning').trim()
    ];

    if (!this.chart) {
      this.chart = new Chart('pieChart', {
        type: 'pie',
        options: this.pieChartOptions,
        data: {
          labels: [this.translateServie.instant("labels.incomes"),
          this.translateServie.instant("labels.expenses"),
          this.translateServie.instant("labels.savings")],
          datasets: [{ data: this.values(), backgroundColor: colors }]
        }
      });

    } else {

      this.chart.data.datasets[0].data = this.values()
      this.chart.update();
    }

  }
}
