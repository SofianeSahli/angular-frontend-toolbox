import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateInputComponent, dateRangeValidator, minDateValidator, SwitchButtons } from '@shared/ui-components';
import { Subscription } from 'rxjs';
import { withSummary } from '../../state/summary/summary.signals';

@Component({
  selector: 'app-date-range',
  imports: [DateInputComponent, ReactiveFormsModule, SwitchButtons],
  templateUrl: './date-range.html',
  styleUrl: './date-range.scss',
})
export class DateRange implements OnInit, OnDestroy {
  summarySignal = inject(withSummary);
  today = new Date().toISOString().split('T')[0];
  private currentDisplayMonth = new Date();
  form = new FormGroup({
    start_date: new FormControl('', [
      Validators.required,
      minDateValidator('2024-01-01')
    ]),
    end_date: new FormControl('', [
      Validators.required
    ]),
  }, { validators: dateRangeValidator('start_date', 'end_date') });
  get startDateControl() { return this.form.get('start_date') as FormControl; }
  get endDateControl() { return this.form.get('end_date') as FormControl; }
  private valueChangesSubscription?: Subscription;

  tabOptions = [
    {
      label: 'labels.today',
      value: 'today'
    },
    {
      label: 'labels.current_week',
      value: 'currentWeek'
    },
    {
      label: 'labels.current_month',
      value: 'currentMonth'
    }
    ,
    {
      label: 'labels.current_year',
      value: 'currentYear'
    },
    {
      label: 'labels.last_month',
      value: 'lastMonth'
    }
  ]
  showingItem = <'today' | 'currentWeek' |
    'currentMonth' | 'lastMonth' | 'currentYear'>('currentMonth')
  quickSelectionDate: any

  changeCurrentDate($event: string) {
    //@ts-expect-error string anyway
    this.showingItem = $event
    return this.setQuickPeriod(this.quickSelectionDate[$event])
  }

  ngOnInit(): void {
    const now = new Date();
    this.quickSelectionDate =
    {
      today: {

        start: new Date(now),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDay() + 2)
      },
      currentWeek: {

        start: this.getStartOfWeek(new Date(now)),
        end: this.getEndOfWeek(new Date(now))
      },
      currentMonth: {

        start: this.getStartOfMonth(new Date(now)),
        end: this.getEndOfMonth(new Date(now))
      },
      lastMonth: {

        start: this.getStartOfMonth(this.getPreviousMonth(new Date(now))),
        end: this.getEndOfMonth(this.getPreviousMonth(new Date(now)))
      },
      currentYear: {

        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      }
    }

    this.initializeCurrentMonthDates();
    this.submit();

    this.valueChangesSubscription = this.form.valueChanges.subscribe(() => {
      // Forcer la mise à jour du label
    });
  }

  ngOnDestroy(): void {
    if (this.valueChangesSubscription) {
      this.valueChangesSubscription.unsubscribe();
    }
  }

  /**
   * Initialise les dates avec le mois en cours
   */
  private initializeCurrentMonthDates(): void {
    const { startOfMonth, endOfMonth } = this.getDatesForMonth(this.currentDisplayMonth);

    this.form.patchValue({
      start_date: this.formatDateForInput(startOfMonth),
      end_date: this.formatDateForInput(endOfMonth)
    }, { emitEvent: false });
  }

  /**
   * Obtient les dates de début et fin d'un mois spécifique
   */
  private getDatesForMonth(date: Date): { startOfMonth: Date; endOfMonth: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    return { startOfMonth, endOfMonth };
  }

  /**
   * Formate une date pour l'input type="date" (YYYY-MM-DD)
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Soumet le formulaire pour charger le résumé
   */
  submit(): void {
    if (this.form.valid) {
      const currentModel = this.form.getRawValue();
      this.summarySignal.loadSummary({
        start_date: currentModel.start_date!,
        end_date: currentModel.end_date!,
      });
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  /**
   * Mois précédent
   */
  previousMonth(): void {
    // Soustraire un mois
    const newMonth = new Date(this.currentDisplayMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    this.currentDisplayMonth = newMonth;

    this.updateFormForCurrentMonth();
    this.submit();
  }

  /**
   * Mois suivant
   */
  nextMonth(): void {
    const newMonth = new Date(this.currentDisplayMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    this.currentDisplayMonth = newMonth;

    this.updateFormForCurrentMonth();
    this.submit();
  }

  /**
   * Met à jour le formulaire pour le mois courant
   */
  private updateFormForCurrentMonth(): void {
    const { startOfMonth, endOfMonth } = this.getDatesForMonth(this.currentDisplayMonth);

    this.form.patchValue({
      start_date: this.formatDateForInput(startOfMonth),
      end_date: this.formatDateForInput(endOfMonth)
    }, { emitEvent: false });
  }

  /**
   * Retourne au mois en cours
   */
  currentMonth(): void {
    this.currentDisplayMonth = new Date();
    this.updateFormForCurrentMonth();
    this.submit();
  }


  // Méthodes helpers pour les périodes rapides
  private getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    return new Date(date.getFullYear(), date.getMonth(), diff);
  }

  private getEndOfWeek(date: Date): Date {
    const start = this.getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  }

  private getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  private getPreviousMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    return newDate;
  }

  /**
   * Définit une période rapide
   */
  setQuickPeriod(period: { start: Date; end: Date }): void {
    this.form.patchValue({
      start_date: this.formatDateForInput(period.start),
      end_date: this.formatDateForInput(period.end)
    });
    this.currentDisplayMonth = new Date(period.start);
    this.submit();
  }

  /**
   * Obtient le label du mois actuellement affiché
   */
  getCurrentMonthLabel(): string {
    const formatted = this.currentDisplayMonth.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  /**
   * Marque tous les champs d'un FormGroup comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}