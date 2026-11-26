import { Injectable, inject } from '@angular/core';
import { addYears, todayIn } from '@shared/util-format';
import { firstValueFrom } from 'rxjs';
import { Book } from '../../households/data/models';
import { MIN_MONTH } from '../../ledger/month-context';
import { quietReads } from '../../ledger/quiet-reads';
import { HISTORY_SIZE } from '../support/suggestion';
import { EntriesApi } from './entries-api';
import { Entry } from './models';

const PAGE_SIZE = 25;

@Injectable({ providedIn: 'root' })
export class EntryHistory {
  private readonly api = inject(EntriesApi);
  private readonly cache = new Map<string, Promise<readonly Entry[]>>();

  forBook(accountId: string, book: Book): Promise<readonly Entry[]> {
    const key = this.key(accountId, book.id);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const filters = { from: `${MIN_MONTH}-01`, to: addYears(todayIn(book.timezone), 1), type: null, category: null, author: accountId };
    const limits = { maxPages: Math.ceil(HISTORY_SIZE / PAGE_SIZE), maxItems: HISTORY_SIZE };
    const pending = firstValueFrom(this.api.collect(book.id, filters, limits, quietReads())).then(
      (collection) => collection.items,
      (error: unknown) => {
        this.cache.delete(key);
        throw error;
      },
    );
    this.cache.set(key, pending);
    return pending;
  }

  invalidate(accountId: string, bookId: string): void {
    this.cache.delete(this.key(accountId, bookId));
  }

  private key(accountId: string, bookId: string): string {
    return `${accountId}|${bookId}`;
  }
}
