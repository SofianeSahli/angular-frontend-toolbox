import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DONE, StoreResult, toApiError } from '../../households/data/store-result';
import { CategoriesApi } from './categories-api';
import { readStoredTree, writeStoredTree } from './categories-storage';
import { CategoryNode, CategoryType, Top } from './models';

export type CategoriesStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CategoriesState {
  tops: readonly Top[];
  etag: string | null;
  status: CategoriesStatus;
  revalidated: boolean;
}

const initialState: CategoriesState = {
  tops: [],
  etag: null,
  status: 'idle',
  revalidated: false,
};

const TYPE_ORDER: readonly CategoryType[] = ['expense', 'income', 'saving'];

function indexTree(tops: readonly Top[]): Map<string, CategoryNode> {
  const index = new Map<string, CategoryNode>();
  for (const top of tops) {
    const base = { type: top.type, top, isOther: false };
    index.set(top.code, {
      ...base,
      code: top.code,
      key: top.key,
      level: 'top',
      emoji: top.emoji,
      retired: top.retired,
      group: null,
      leaf: null,
    });
    for (const group of top.groups) {
      index.set(group.code, {
        ...base,
        code: group.code,
        key: group.key,
        level: 'group',
        emoji: group.emoji,
        retired: group.retired,
        group,
        leaf: null,
      });
      for (const leaf of group.leaves) {
        index.set(leaf.code, {
          ...base,
          code: leaf.code,
          key: leaf.key,
          level: 'leaf',
          emoji: leaf.emoji ?? group.emoji,
          retired: leaf.retired,
          isOther: leaf.isOther,
          group,
          leaf,
        });
      }
    }
  }
  return index;
}

export const CategoriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    index: computed(() => indexTree(store.tops())),
    orderedTops: computed(() => [...store.tops()].sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))),
  })),
  withComputed((store) => ({
    offerableLeaves: computed(() => [...store.index().values()].filter((node) => node.level === 'leaf' && !node.retired)),
  })),
  withMethods((store, api = inject(CategoriesApi)) => {
    let loadPromise: Promise<StoreResult> | null = null;

    function hydrate(): void {
      if (store.status() !== 'idle') return;
      const stored = readStoredTree();
      if (stored !== null)
        patchState(store, {
          tops: stored.tops,
          etag: stored.etag,
          status: 'ready',
        });
    }

    async function revalidate(): Promise<StoreResult> {
      if (store.status() !== 'ready') patchState(store, { status: 'loading' });
      try {
        const answer = await firstValueFrom(api.tree(store.etag()));
        if (answer !== 'notModified') {
          patchState(store, { tops: answer.tops, etag: answer.etag });
          writeStoredTree(answer);
        }
        patchState(store, { status: 'ready', revalidated: true });
        return DONE;
      } catch (error) {
        patchState(store, {
          status: store.tops().length > 0 ? 'ready' : 'error',
        });
        return { outcome: 'error', error: toApiError(error) };
      }
    }

    return {
      load(options: { force?: boolean } = {}): Promise<StoreResult> {
        hydrate();
        if (loadPromise !== null) return loadPromise;
        if (store.revalidated() && options.force !== true) return Promise.resolve(DONE);
        const run = revalidate();
        loadPromise = run;
        void run.finally(() => {
          if (loadPromise === run) loadPromise = null;
        });
        return run;
      },

      node(code: string): CategoryNode | null {
        return store.index().get(code) ?? null;
      },

      isOfferable(code: string): boolean {
        const node = store.index().get(code);
        return node !== undefined && node.level === 'leaf' && !node.retired;
      },
    };
  }),
);
