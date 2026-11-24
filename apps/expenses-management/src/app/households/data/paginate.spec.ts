import { firstValueFrom, of } from 'rxjs';
import { Page, fetchAll } from './paginate';

describe('fetchAll', () => {
  it('returns a single page without following anything', async () => {
    const fetchPage = vi.fn((_cursor: string | null) => of<Page<number>>({ data: [1, 2], meta: { next_cursor: null } }));
    expect(await firstValueFrom(fetchAll(fetchPage))).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(null);
  });

  it('follows next_cursor until null and keeps order', async () => {
    const pages: Record<string, Page<number>> = {
      start: { data: [1, 2], meta: { next_cursor: 'c2' } },
      c2: { data: [3], meta: { next_cursor: 'c3' } },
      c3: { data: [4, 5], meta: { next_cursor: null } },
    };
    const fetchPage = vi.fn((cursor: string | null) => of(pages[cursor ?? 'start']));
    expect(await firstValueFrom(fetchAll(fetchPage))).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage.mock.calls.map(([cursor]) => cursor)).toEqual([null, 'c2', 'c3']);
  });

  it('returns an empty list for an empty page', async () => {
    expect(await firstValueFrom(fetchAll(() => of<Page<number>>({ data: [], meta: { next_cursor: null } })))).toEqual([]);
  });
});
