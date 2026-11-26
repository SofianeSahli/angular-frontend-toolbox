import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { book } from '../../households/testing';
import { entry } from '../testing';
import { EntriesApi } from './entries-api';
import { EntryHistory } from './entry-history';
import { EntryCollection, EntryFilters } from './models';

function setup() {
  const api = {
    collect: vi
      .fn<(bookId: string, filters: EntryFilters, limits: { maxPages: number; maxItems?: number }) => Observable<EntryCollection>>()
      .mockReturnValue(of({ items: [entry('e1')], complete: false })),
  };
  TestBed.configureTestingModule({ providers: [{ provide: EntriesApi, useValue: api }] });
  return { api, history: TestBed.inject(EntryHistory) };
}

describe('EntryHistory (spec 009 REQ-3.3, 3.6)', () => {
  it("reads the account's last 30 entries in the book once per session", async () => {
    const { api, history } = setup();
    expect((await history.forBook('u1', book('b1'))).map((item) => item.id)).toEqual(['e1']);
    await history.forBook('u1', book('b1'));
    expect(api.collect).toHaveBeenCalledTimes(1);
    const [bookId, filters, limits] = api.collect.mock.calls[0];
    expect(bookId).toBe('b1');
    expect(filters).toMatchObject({ from: '2000-01-01', author: 'u1', type: null, category: null });
    expect(limits).toEqual({ maxPages: 2, maxItems: 30 });
  });

  it('reads again after a save and after a failure', async () => {
    const { api, history } = setup();
    await history.forBook('u1', book('b1'));
    history.invalidate('u1', 'b1');
    await history.forBook('u1', book('b1'));
    expect(api.collect).toHaveBeenCalledTimes(2);
    api.collect.mockReturnValueOnce(throwError(() => new Error('offline')));
    history.invalidate('u1', 'b1');
    await expect(history.forBook('u1', book('b1'))).rejects.toThrow('offline');
    await history.forBook('u1', book('b1'));
    expect(api.collect).toHaveBeenCalledTimes(4);
  });
});
