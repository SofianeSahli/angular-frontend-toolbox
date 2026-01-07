import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface LoaderInt {
  loading: boolean;
}


export const withLoader = () =>
  signalStoreFeature(
    withState({ isLoading: false }),
    withMethods((state) => ({
      setLoading(value: boolean) {
        patchState(state, { isLoading: value });
      },
    }))
  );
