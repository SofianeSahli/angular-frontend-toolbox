import { inject, Type } from '@angular/core';
import { patchState, signalStoreFeature, withMethods } from '@ngrx/signals';
import {
  removeAllEntities,
  removeEntity,
  setEntities,
  updateEntity,
  upsertEntities,
  upsertEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, exhaustMap, finalize, of, pipe, switchMap, tap } from 'rxjs';
import { BaseService } from '../base.service';
import { BaseModel } from '../models/Base.model';
import { GeneralQuery } from './with-query.signal';

export const withCrudOperations = <Entity extends BaseModel>(
  dataServiceType: Type<BaseService<Entity>>,
  options?: { resetOnLoad?: boolean }
) => {
  return signalStoreFeature(
    withMethods((store: any) => {
      const service = inject(dataServiceType);

      return {
        reset: () => {
          patchState(store, removeAllEntities());
        },
        getById: (id: string): Entity | null => {
          const entities = store.entityMap();
          return entities[id] ?? null;
        },
        load: rxMethod<GeneralQuery>(
          pipe(
            tap(() => store?.setLoading(true)),
            exhaustMap((query) => {
              return service.load(query).pipe(
                tap((result) => {
                  if (!Array.isArray(result)) {
                    patchState(store, setEntities(result.items));
                    store.setQuery({
                      ...store.query(),
                      page: result.page,
                      totalPages: result.totalPages,
                      totalItems: result.totalItems,
                    });
                  } else {
                    if (options?.resetOnLoad) {
                      patchState(store, setEntities(result));
                    } else {
                      patchState(store, upsertEntities(result));
                    }
                  }
                },
                ),
                finalize(() => store?.setLoading(false))
              );
            })
          )
        ),
        addItem: rxMethod<Partial<Entity>>(
          pipe(
            tap(() => store?.setLoading(true)),
            exhaustMap((entity) =>
              service.create(entity).pipe(
                tap((added) => {
                  if (Array.isArray(added)) {
                    patchState(store, upsertEntities(added));
                  } else {
                    patchState(store, upsertEntity(added));
                  }
                  store?.setLoading(false);
                  store.setItemCreated?.(true);
                },
                ),
                catchError((err) => {
                  store?.setLoading(false);
                  store.setItemCreated?.(true);
                  return of(null)
                })
              )
            )
          )
        ),
        deleteItem: rxMethod<string>(
          pipe(
            tap(() => store?.setLoading(true)),
            switchMap((id) =>
              service.delete(id).pipe(
                tap(() => patchState(store, removeEntity(id))),
                finalize(() => store?.setLoading(false))
              )
            )
          )
        ),

        update: rxMethod<Entity>(
          pipe(
            tap(() => store?.setLoading(true)),
            switchMap((entity) =>
              service.update(entity).pipe(
                tap(() => {
                  patchState(
                    store,
                    updateEntity({ id: entity.id, changes: entity })
                  );
                  store.setItemCreated?.(true);
                }),
                finalize(() => store?.setLoading(false))
              )
            )
          )
        ),
      };
    })
  );
};
