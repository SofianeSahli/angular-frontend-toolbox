import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseService, PaginatedEntities } from '@shared/stores';
import { environment } from 'apps/expenses-management/src/environments/environments';
import { Observable } from 'rxjs';
import { SummaryModel } from '../summary/Summary.model';
import { MoneyTransition, MoneyTransitionQuery } from './MoneyTransition.model';

@Injectable({ providedIn: 'root' })
export class MoneyTransitionService implements BaseService<MoneyTransition> {
  httpClient = inject(HttpClient);
  ENTITY_ENDPOINT: string = '/money-transition';
  BASE_URL = environment.mainAppUrl;

  toQueryParams(filters: MoneyTransitionQuery) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(key + '[]', v);
          }
        });
      } else {
        params.append(key, value);
      }
    });

    return params.toString();
  }

  load(
    query: MoneyTransitionQuery
  ): Observable<MoneyTransition[] | PaginatedEntities<MoneyTransition>> {
    return this.httpClient.get<PaginatedEntities<MoneyTransition>>(
      `${this.BASE_URL}${this.ENTITY_ENDPOINT}?${this.toQueryParams(query)}`
    );
  }

  create(args: Partial<MoneyTransition>): Observable<MoneyTransition> {
    return this.httpClient.post<MoneyTransition>(
      `${this.BASE_URL}${this.ENTITY_ENDPOINT}`,
      args
    );
  }
  update(object: MoneyTransition): Observable<MoneyTransition> {
    return this.httpClient.patch<MoneyTransition>(
      `${this.BASE_URL}${this.ENTITY_ENDPOINT}/${object.id}`,
      object
    );
  }

  delete(id: string) {
    return this.httpClient.delete<MoneyTransition>(
      `  ${this.BASE_URL}${this.ENTITY_ENDPOINT}/${id}`
    );
  }

  fetchSummary(query?: any) {
    return this.httpClient.get<SummaryModel>(
      `${this.BASE_URL}${this.ENTITY_ENDPOINT}/summary?${this.toQueryParams(
        query
      )}`
    );
  }
}
