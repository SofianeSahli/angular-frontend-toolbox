import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { GeneralQuery, withLoader, withQuery } from '@shared/stores';
import { exhaustMap, filter, finalize, pipe, tap } from 'rxjs';
import { MoneyTransitionService } from '../money-transitions/money-transition.service';
import { MoneyTransitionQuery } from '../money-transitions/MoneyTransition.model';
import { SummaryModel } from './Summary.model';


const initialSummaryState: SummaryModel = {
  start_date: '',
  end_date: '',
  number_of_entries: 0,
  number_income_entries: 0,
  number_expenses_entries: 0,
  total_income_amount: 0,
  total_expenses_amount: 0,
  total_saved_amount: 0,
  number_savings_entries: 0,
  daily_income: {},
  daily_expenses: {},
  daily_savings: {}
};

export const withSummary = signalStore(
  { providedIn: 'root' },
  withState({ summary: initialSummaryState }),
  withLoader(),
  withQuery(),
  withMethods((store) => {
    const service = inject(MoneyTransitionService);
    return {
      loadSummary: rxMethod<Partial<MoneyTransitionQuery>>(
        pipe(
          filter(() => !store.isLoading?.()),
          tap(() => store.setLoading(true)),
          exhaustMap((query: GeneralQuery) => {
            return service.fetchSummary(query)
          }),
          tap({
            next: (summary: SummaryModel) => {
              store.setLoading(false)
              patchState(store, { summary: summary });
            }
          }), finalize(() => store.setLoading(false)),
        )
      ),
    };
  })
);
