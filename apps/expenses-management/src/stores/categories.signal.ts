import { signalStore, withHooks } from '@ngrx/signals';
import { CategoriesService } from '../services/Categories.service';
import { withCrudOperations, withLoader, withQuery } from '@shared/stores';
import { withEntities } from '@ngrx/signals/entities';
import { Categorie } from '../models/Categorie.model';

export const categoriesStore = signalStore(
  { providedIn: 'root' },
  withQuery(),
  withLoader(),
  withCrudOperations(CategoriesService),
  withEntities<Categorie>(),
  withHooks({
    onInit: (store) => {
      store.load({});
    },
  })
);
