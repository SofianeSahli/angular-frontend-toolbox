import { HttpTestingController } from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollService } from '@shared/ui-components';
import { appTestProviders } from '../../testing/test-providers';
import { List } from './list/list';
import { MoneyTransition } from './state/money-transitions/MoneyTransition.model';
import { DateRange } from './summary/date-range-filter/date-range';

// spec 001 T14 (REQ-3.5c): screens driven by timers, scroll events and HTTP
// pages must keep updating after switching to OnPush. Written before the
// switch; HTTP responses are flushed inside NgZone, as they arrive in the app.

function transition(id: string): MoneyTransition {
  return {
    id,
    amount: '10.000',
    description: `Dépense ${id}`,
    date: '2026-11-20',
    batch_id: 'b',
    occurence: 'one_time',
    categorie: { id: 'c1', name: 'Alimentation', children: [], is_income: 0 },
  };
}

describe('List (infinite scroll)', () => {
  let fixture: ComponentFixture<List>;
  let http: HttpTestingController;
  let zone: NgZone;
  const rows = () => fixture.nativeElement.querySelectorAll('app-list-items').length;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [List], providers: appTestProviders() });
    http = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(List);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('shows the first page, then appends the next page after a scroll to the bottom', async () => {
    zone.run(() =>
      http
        .expectOne((r) => r.url.includes('/money-transition?') && r.url.includes('page=1'))
        .flush({ items: [transition('t1')], page: 1, totalPages: 2, totalItems: 20 })
    );
    await fixture.whenStable();
    expect(rows()).toBe(1);

    zone.run(() => TestBed.inject(ScrollService).triggerLoadMore());
    await fixture.whenStable();

    zone.run(() =>
      http
        .expectOne((r) => r.url.includes('/money-transition?') && r.url.includes('page=2'))
        .flush({ items: [transition('t2')], page: 2, totalPages: 2, totalItems: 20 })
    );
    await fixture.whenStable();
    expect(rows()).toBe(2);
  });
});

describe('DateRange (month navigation)', () => {
  let fixture: ComponentFixture<DateRange>;
  const label = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
  const monthLabel = (d: Date) => {
    const s = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const buttons = () => fixture.nativeElement.querySelectorAll('button.btn-secondary') as NodeListOf<HTMLButtonElement>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [DateRange], providers: appTestProviders() });
    fixture = TestBed.createComponent(DateRange);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('shows the current month, and the previous / next month when navigating', async () => {
    const now = new Date();
    expect(label()).toContain(monthLabel(now));

    buttons()[0].click(); // previous month
    await fixture.whenStable();
    expect(label()).toContain(monthLabel(new Date(now.getFullYear(), now.getMonth() - 1, 1)));

    buttons()[1].click(); // next month
    await fixture.whenStable();
    expect(label()).toContain(monthLabel(now));
  });
});
