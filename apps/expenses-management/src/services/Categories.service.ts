import { BaseService, GeneralQuery, PaginatedEntities } from '@shared/stores';
import { Observable } from 'rxjs';
import { Categorie } from '../models/Categorie.model';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environments';
@Injectable({providedIn: 'root'})
export class CategoriesService implements BaseService<Categorie> {
  httpClient = inject(HttpClient);
  load(
    query: GeneralQuery
  ): Observable<Categorie[] | PaginatedEntities<Categorie>> {
    return this.httpClient.get<Categorie[]>(
      environment.mainAppUrl + environment.categoriesEndpoint
    );
  }
  create(args: Partial<Categorie>): Observable<Categorie> {
    throw 'no body';
  }
  update(object: Categorie): Observable<Categorie> {
    throw 'no body';
  }
  delete(id: string): Observable<any> {
    throw 'no body';
  }
}
