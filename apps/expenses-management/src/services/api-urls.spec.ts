import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MoneyTransitionService } from '../app/money-transactions/state/money-transitions/money-transition.service';
import { MoneyTransitionQuery } from '../app/money-transactions/state/money-transitions/MoneyTransition.model';
import { environment } from '../environments/environments';
import { CategoriesService } from './Categories.service';

// spec 001, REQ-5.6 / REQ-5.7: one API base URL per app, pointing at the rebuilt backend in dev.
describe('expenses request URLs', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('development apiBaseUrl is the rebuilt backend', () => {
    expect(environment.apiBaseUrl).toBe('http://localhost:8001/api/v1');
  });

  it('categories load from apiBaseUrl', () => {
    TestBed.inject(CategoriesService).load({}).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/categories`);
  });

  it('money transactions load from apiBaseUrl', () => {
    TestBed.inject(MoneyTransitionService)
      .load({ page: 1 } as MoneyTransitionQuery)
      .subscribe();
    http.expectOne(`${environment.apiBaseUrl}/money-transition?page=1`);
  });

  it('money transaction delete targets apiBaseUrl', () => {
    TestBed.inject(MoneyTransitionService).delete('t1').subscribe();
    http.expectOne({ method: 'DELETE', url: `${environment.apiBaseUrl}/money-transition/t1` });
  });
});
