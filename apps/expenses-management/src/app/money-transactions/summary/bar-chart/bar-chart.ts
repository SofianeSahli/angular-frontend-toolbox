import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-bar-chart',
  imports: [CommonModule],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChart {
  private chart!: Chart;
  translateServie = inject(TranslateService)
  dailyIncome = input<{ [date: string]: number }>({});
  dailyExpenses = input<{ [date: string]: number }>({});
  dailySavings = input<{ [date: string]: number }>({});
  barChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: []
  });
  bodyColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bs-body-color')
    .trim();
  barChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: this.translateServie.instant('labels.daily_summary')
      },
      tooltip: {
        mode: 'index',
        intersect: false,

      }
    },

    scales: {
      x: {
        ticks: {
          color: this.bodyColor
        },
        grid: {
          color: this.bodyColor,

        }
      },
      y: {
        ticks: {
          color: this.bodyColor
        },
        grid: {
          color: this.bodyColor
        }
      }
    }

  };

  constructor() {
    effect(() => {
      this.updateChartData()
    })
  }

  private updateChartData(): void {
    const incomeData = this.dailyIncome();
    const expensesData = this.dailyExpenses();
    const savingsData = this.dailySavings();
    const allDates = this.getAllDates(incomeData, expensesData, savingsData);
    const fomrmatedDates = allDates
      .map((date: string) => {
        const [day, month, year] = date.split('-').map(Number);
        return {
          dateString: date,
          dateObj: new Date(year, month - 1, day)
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()) // oldest to newest
      .map(({ dateObj }) =>
        new Intl.DateTimeFormat('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(dateObj)
      );
    if (this.chart) {
      this.chart.destroy()
    }
    this.chart = new Chart('barchart', {
      type: 'bar',
      data: {
        labels: fomrmatedDates,
        datasets: [
          {
            label: this.translateServie.instant("labels.incomes"),
            data: allDates.map((date: string) => incomeData[date] || 0),
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-success').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-success').trim(),
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: this.translateServie.instant("labels.expenses"),
            data: allDates.map(date => expensesData[date] || 0),
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-danger').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-danger').trim(),
            borderWidth: 1,
            borderRadius: 4,
          },


          {
            label: this.translateServie.instant("labels.savings"),
            data: allDates.map(date => savingsData[date] || 0),
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-warning').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bs-warning').trim(),
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      }, options: this.barChartOptions
    });

    // Update chart if it exists
    this.chart?.update();
  }

  private getAllDates(...dataObjects: { [date: string]: number }[]): string[] {
    const allDates = new Set<string>();

    dataObjects.forEach(data => {
      Object.keys(data).forEach(date => allDates.add(date));
    });

    return Array.from(allDates);
  }


}