import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { config as rxjsConfig, Observable, of, throwError } from 'rxjs';
import { BaseService } from '../base.service';
import { BaseModel } from '../models/Base.model';
import { PaginatedEntities } from '../models/Paginated.model';
import { withCrudOperations } from './base-crud.signals';
import { withLoader } from './with-loader.signal';
import { withQuery } from './with-query.signal';

interface Item extends BaseModel {
  label: string;
}

@Injectable()
class FakeItemService implements BaseService<Item> {
  next: () => Observable<Item[] | PaginatedEntities<Item>> = () => of([]);
  load() {
    return this.next();
  }
  create(args: Partial<Item>) {
    return of({ id: 'new', label: args.label ?? '' });
  }
  update(object: Item) {
    return of(object);
  }
  delete() {
    return of(null);
  }
}

const ItemStore = signalStore(
  withLoader(),
  withQuery(),
  withEntities<Item>(),
  withCrudOperations<Item>(FakeItemService)
);

describe('withCrudOperations', () => {
  let store: InstanceType<typeof ItemStore>;
  let service: FakeItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FakeItemService, ItemStore] });
    store = TestBed.inject(ItemStore);
    service = TestBed.inject(FakeItemService);
  });

  it('stores the entities returned by load and clears the loader', () => {
    service.next = () => of([{ id: '1', label: 'a' }, { id: '2', label: 'b' }]);

    store.load({});

    expect(store.ids()).toEqual(['1', '2']);
    expect(store.isLoading()).toBe(false);
  });

  it('copies pagination from a paginated response into the query', () => {
    service.next = () =>
      of({ items: [{ id: '1', label: 'a' }], page: 2, totalPages: 5, totalItems: 41 });

    store.load({ page: 2 });

    expect(store.ids()).toEqual(['1']);
    expect(store.query()).toMatchObject({ page: 2, totalPages: 5, totalItems: 41 });
  });

  // Documents TODAY's behaviour; spec 005 adds error handling.
  // A failed load clears the loader, but the error is not caught: it
  // escapes as an unhandled RxJS error and the load stream ends, so
  // later load() calls do nothing.
  it('clears the loader after a failed load, then ignores later loads (known issue, spec 005)', async () => {
    const unhandled: unknown[] = [];
    const previous = rxjsConfig.onUnhandledError;
    rxjsConfig.onUnhandledError = (e) => unhandled.push(e);
    try {
      service.next = () => throwError(() => new Error('boom'));
      store.load({});
      expect(store.isLoading()).toBe(false);

      service.next = () => of([{ id: '1', label: 'a' }]);
      store.load({});
      expect(store.ids()).toEqual([]);

      await new Promise((resolve) => setTimeout(resolve));
      expect(unhandled).toEqual([new Error('boom')]);
    } finally {
      rxjsConfig.onUnhandledError = previous;
    }
  });
});
