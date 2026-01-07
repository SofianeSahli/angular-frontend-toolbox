import { signalStore, withHooks } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import {
  withCrudOperations,
  withItemCreated,
  withLoader,
  withQuery,
} from '@shared/stores';
import { MoneyTransitionService } from './money-transition.service';
import { MoneyTransition } from './MoneyTransition.model';

export const moneyTransitionSignalStore = signalStore(
  { providedIn: 'root' },
  withLoader(),
  withQuery(),
  withItemCreated(),
  withEntities<MoneyTransition>(),
  withCrudOperations<MoneyTransition>(MoneyTransitionService),
  withHooks({
    onInit: (store) => {
      if (store.entities().length === 0) {
        store.load({ itemPerPage: 10, page: 1 });
      }
    },
  })
);
