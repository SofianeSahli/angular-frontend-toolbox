import { Observable } from 'rxjs';
import { PaginatedEntities } from './models/Paginated.model';
import { GeneralQuery } from './signals/with-query.signal';

export interface BaseService<T> {
  load(query: GeneralQuery): Observable<T[] | PaginatedEntities<T>>;
  create(args: Partial<T>): Observable<T>;
  update(object: T): Observable<T>;
  delete(id: string): Observable<any>;
}
