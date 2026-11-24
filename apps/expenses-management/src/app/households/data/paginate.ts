import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

export interface Page<T> {
  readonly data: readonly T[];
  readonly meta: { readonly next_cursor: string | null };
}

export function fetchAll<T>(fetchPage: (cursor: string | null) => Observable<Page<T>>): Observable<T[]> {
  return fetchPage(null).pipe(
    expand((page) => (page.meta.next_cursor === null ? EMPTY : fetchPage(page.meta.next_cursor))),
    map((page) => page.data),
    reduce<readonly T[], T[]>((all, items) => [...all, ...items], []),
  );
}
