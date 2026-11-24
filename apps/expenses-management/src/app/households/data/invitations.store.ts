import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { handling } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';
import { InvitationsApi } from './invitations-api';
import { ReceivedInvitation } from './models';
import { DONE, StoreResult, toResult } from './store-result';

interface InvitationsState {
  received: readonly ReceivedInvitation[];
  loading: boolean;
}

const initialState: InvitationsState = { received: [], loading: false };

export const InvitationsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, api = inject(InvitationsApi), household = inject(HouseholdStore), books = inject(BooksStore)) => {
    const without = (id: string): readonly ReceivedInvitation[] => store.received().filter((invitation) => invitation.id !== id);

    return {
      async load(): Promise<StoreResult> {
        if (household.household() !== null) {
          patchState(store, { received: [] });
          return DONE;
        }
        patchState(store, { loading: true });
        const result = await toResult(async () => {
          patchState(store, { received: await firstValueFrom(api.received()) });
        });
        patchState(store, { loading: false });
        return result;
      },

      async accept(id: string): Promise<StoreResult> {
        const result = await toResult(async () => {
          const accepted = await firstValueFrom(api.accept(id, handling('invitation.not_found', 'household.already_joined', 'household.member_limit')));
          household.applyAccepted(accepted);
        });
        if (result.outcome === 'done') {
          patchState(store, { received: [] });
          await books.load({ force: true });
          return DONE;
        }
        if (result.error.code === 'invitation.not_found') patchState(store, { received: without(id) });
        if (result.error.code === 'household.already_joined') {
          patchState(store, { received: [] });
          await household.loadHousehold();
        }
        return result;
      },

      async decline(id: string): Promise<StoreResult> {
        const result = await toResult(() => firstValueFrom(api.decline(id, handling('invitation.not_found'))));
        if (result.outcome === 'done' || result.error.code === 'invitation.not_found') patchState(store, { received: without(id) });
        return result;
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
