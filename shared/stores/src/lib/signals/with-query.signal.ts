import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface GeneralQuery {
  user_uuid?: string | undefined;
  page?: number;
  itemPerPage?: number;
  totalItems?: number;
  totalPages?: number;
  term?: string;
  commentable_id?: string;
  commentable_type?: string;
}
const initialQuery: GeneralQuery = {
  itemPerPage: 5,
  page: 1,
};

export const withQuery = () =>
  signalStoreFeature(
    withState({ query: initialQuery }),
    withMethods((store) => ({
      setQuery: (newQuery: Partial<GeneralQuery>) =>
        patchState(store, { query: { ...store.query(), ...newQuery } }),
      resesetQuery: (newQuery: Partial<GeneralQuery>) =>
        patchState(store, { query: newQuery }),
    })),
    withMethods((store) => {
      return {
        canLoadMore: () => {
          const query = store.query();
          return (
            query.page! < query.totalPages! &&
            query.totalItems! > query.itemPerPage!
          );
        },
      };
    })
  );
