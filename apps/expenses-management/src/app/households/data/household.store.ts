import { Injector, computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { handling } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { BooksStore } from './books.store';
import { HouseholdsApi } from './households-api';
import { InvitationsApi } from './invitations-api';
import { Household, Invitation, Member } from './models';
import { DONE, StoreResult, toResult } from './store-result';

interface HouseholdState {
  household: Household | null;
  members: readonly Member[];
  sent: readonly Invitation[];
  loading: boolean;
}

const initialState: HouseholdState = { household: null, members: [], sent: [], loading: false };

export const HouseholdStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isOwner: computed(() => store.household()?.role === 'owner'),
    isMember: computed(() => store.household()?.role === 'member'),
  })),
  withMethods((store, api = inject(HouseholdsApi), invitations = inject(InvitationsApi), injector = inject(Injector)) => {
    const refreshBooks = (): Promise<StoreResult> => injector.get(BooksStore).load({ force: true });

    const loadMembers = async (id: string): Promise<void> => {
      patchState(store, { members: await firstValueFrom(api.members(id)) });
    };

    async function loadHousehold(): Promise<StoreResult> {
      return toResult(async () => {
        const households = await firstValueFrom(api.list());
        patchState(store, { household: households[0] ?? null });
      });
    }

    function clearHousehold(): void {
      patchState(store, { household: null, members: [], sent: [] });
    }

    return {
      loadHousehold,

      async loadDetail(): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return DONE;
        patchState(store, { loading: true });
        const result = await toResult(async () => {
          const [members, sent] = await Promise.all([
            firstValueFrom(api.members(household.id)),
            household.role === 'owner' ? firstValueFrom(invitations.sent(household.id)) : Promise.resolve([]),
          ]);
          patchState(store, { members, sent });
        });
        patchState(store, { loading: false });
        return result;
      },

      create(name: string): Promise<StoreResult> {
        return toResult(async () => {
          const household = await firstValueFrom(api.create(name, handling('household.limit_reached', 'request.throttled')));
          patchState(store, { household, members: [], sent: [] });
        });
      },

      async rename(name: string): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return DONE;
        const result = await toResult(async () => {
          const renamed = await firstValueFrom(api.rename(household.id, name, handling('household.forbidden', 'household.not_found')));
          patchState(store, { household: renamed });
        });
        if (result.outcome === 'error' && result.error.code === 'household.forbidden') await loadHousehold();
        return result;
      },

      async deleteHousehold(): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return DONE;
        const result = await toResult(() => firstValueFrom(api.remove(household.id, handling('household.forbidden', 'household.not_found'))));
        if (result.outcome === 'error' && result.error.code !== 'household.not_found') return result;
        clearHousehold();
        await refreshBooks();
        return DONE;
      },

      async removeMember(userId: string): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return DONE;
        const result = await toResult(() => firstValueFrom(api.removeMember(household.id, userId, handling('member.not_found', 'household.not_found'))));
        if (result.outcome === 'done') {
          patchState(store, { members: store.members().filter((member) => member.id !== userId) });
          return DONE;
        }
        if (result.error.code === 'member.not_found') {
          await toResult(() => loadMembers(household.id));
          return DONE;
        }
        return result;
      },

      async leave(): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return DONE;
        const result = await toResult(() => firstValueFrom(api.leave(household.id, handling('household.owner_cannot_leave', 'household.not_found'))));
        if (result.outcome === 'error') {
          if (result.error.code === 'household.owner_cannot_leave') await loadHousehold();
          if (result.error.code !== 'household.not_found') return result;
        }
        clearHousehold();
        await refreshBooks();
        return DONE;
      },

      invite(email: string): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return Promise.resolve(DONE);
        return toResult(async () => {
          const invitation = await firstValueFrom(
            invitations.invite(
              household.id,
              email,
              handling('invitation.self', 'invitation.already_member', 'invitation.already_pending', 'invitation.limit_reached', 'household.member_limit', 'request.throttled'),
            ),
          );
          patchState(store, { sent: [...store.sent(), invitation] });
        });
      },

      async cancelInvitation(invitationId: string): Promise<StoreResult> {
        const household = store.household();
        if (household === null) return DONE;
        const result = await toResult(() => firstValueFrom(invitations.cancel(household.id, invitationId, handling('invitation.not_found', 'household.not_found'))));
        if (result.outcome === 'error' && result.error.code !== 'invitation.not_found') return result;
        patchState(store, { sent: store.sent().filter((invitation) => invitation.id !== invitationId) });
        return DONE;
      },

      applyAccepted(household: Household): void {
        patchState(store, { household, members: [], sent: [] });
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
