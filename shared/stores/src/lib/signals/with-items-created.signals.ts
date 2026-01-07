import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface ItemCreated {
  isItemCreated: boolean;
}
const initialLoaderState: ItemCreated = {
  isItemCreated: false,
};

export const withItemCreated = () =>
  signalStoreFeature(
    withState(initialLoaderState),
    withMethods((store) => ({
      setItemCreated(value: boolean) {
        patchState(store, { isItemCreated: value });
      },
      resetItemCreated() {
        patchState(store, { isItemCreated: false });
      },
    }))
  );