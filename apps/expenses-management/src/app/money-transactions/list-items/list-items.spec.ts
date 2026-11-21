import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { ListItems } from './list-items';

describe('ListItems', () => {
  let fixture: ComponentFixture<ListItems>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ListItems],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(ListItems);
    fixture.componentRef.setInput('moneyTransition', {
      id: 't1', amount: '12.500', description: 'Courses', date: '2026-11-20',
      batch_id: 'b1', occurence: 'one_time',
      categorie: { id: 'c1', name: 'Alimentation', children: [], is_income: 0 },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
