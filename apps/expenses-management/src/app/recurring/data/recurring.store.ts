import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiError } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { BooksStore } from '../../households/data/books.store';
import { DONE, StoreResult, toApiError } from '../../households/data/store-result';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { RecurringApi } from './recurring-api';
import { RecurringRule, RuleInput, RulePatch } from './models';

export type RecurringStatus = 'idle' | 'loading' | 'ready' | 'error';

export type RuleWriteResult = { readonly outcome: 'done'; readonly rule: RecurringRule | null } | { readonly outcome: 'error'; readonly error: ApiError };

interface RecurringState {
  bookId: string | null;
  rules: readonly RecurringRule[];
  status: RecurringStatus;
  error: ApiError | null;
  active: boolean;
}

const initialState: RecurringState = { bookId: null, rules: [], status: 'idle', error: null, active: false };

export const RecurringStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, api = inject(RecurringApi), books = inject(BooksStore), ledger = inject(LedgerChanges)) => {
    let generation = 0;

    async function load(quiet = false): Promise<StoreResult> {
      const bookId = store.bookId();
      if (bookId === null) return DONE;
      const started = ++generation;
      if (!quiet) patchState(store, { status: 'loading', error: null });
      try {
        const rules = await firstValueFrom(api.list(bookId));
        if (started !== generation) return DONE;
        patchState(store, { rules, status: 'ready', error: null });
        return DONE;
      } catch (caught) {
        if (started !== generation) return DONE;
        const error = toApiError(caught);
        if (error.code === 'book.not_found') {
          void books.load({ force: true });
          return DONE;
        }
        patchState(store, { status: 'error', error });
        return { outcome: 'error', error };
      }
    }

    function dropRow(id: string): void {
      patchState(store, { rules: store.rules().filter((rule) => rule.id !== id) });
    }

    async function write(bookId: string, call: () => Promise<RecurringRule | null>, id: string | null): Promise<RuleWriteResult> {
      try {
        const rule = await call();
        ledger.changed(bookId, 'all');
        if (store.bookId() === bookId) void load(true);
        return { outcome: 'done', rule };
      } catch (caught) {
        const error = toApiError(caught);
        if (error.code === 'recurring_rule.not_found' && id !== null) dropRow(id);
        if (error.code === 'book.not_found') void books.load({ force: true });
        return { outcome: 'error', error };
      }
    }

    return {
      open(bookId: string): Promise<StoreResult> {
        if (store.bookId() !== bookId) patchState(store, { rules: [] });
        patchState(store, { bookId });
        return load();
      },

      reload(): Promise<StoreResult> {
        return load();
      },

      create(bookId: string, input: RuleInput): Promise<RuleWriteResult> {
        return write(bookId, () => firstValueFrom(api.create(bookId, input)), null);
      },

      update(bookId: string, id: string, patch: RulePatch): Promise<RuleWriteResult> {
        return write(bookId, () => firstValueFrom(api.update(bookId, id, patch)), id);
      },

      remove(bookId: string, id: string): Promise<RuleWriteResult> {
        return write(
          bookId,
          async () => {
            await firstValueFrom(api.remove(bookId, id), { defaultValue: undefined });
            dropRow(id);
            return null;
          },
          id,
        );
      },

      setActive(active: boolean): void {
        patchState(store, { active });
      },

      clear(): void {
        generation += 1;
        patchState(store, { bookId: null, rules: [], status: 'idle', error: null });
      },

      reset(): void {
        generation += 1;
        patchState(store, initialState);
      },
    };
  }),
);
