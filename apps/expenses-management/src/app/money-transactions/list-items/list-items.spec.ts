import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { MoneyTransition } from '../state/money-transitions/MoneyTransition.model';
import { ListItems } from './list-items';

function transition(isIncome: unknown): MoneyTransition {
  return {
    id: 't1',
    amount: '12.500',
    description: 'Courses',
    date: '2026-11-20',
    batch_id: 'b1',
    occurence: 'one_time',
    categorie: { id: 'c1', name: 'Alimentation', children: [], is_income: isIncome as 0 | 1 },
  };
}

describe('ListItems', () => {
  let fixture: ComponentFixture<ListItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListItems],
      providers: appTestProviders(),
    }).compileComponents();
    fixture = TestBed.createComponent(ListItems);
  });

  function classesFor(isIncome: unknown) {
    fixture.componentRef.setInput('moneyTransition', transition(isIncome));
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('.card');
    const header: HTMLElement = fixture.nativeElement.querySelector('.card-header');
    return {
      expensesBorders: card.classList.contains('expenses-borders'),
      incomeBorders: card.classList.contains('income-borders'),
      bgDanger: header.classList.contains('bg-danger'),
      bgSuccess: header.classList.contains('bg-success'),
    };
  }

  // Pins the behaviour of the original `== 0` / `== 1` template checks
  // (spec 001 T11), for every shape the API might send.
  it.each([
    [0, { expensesBorders: true, incomeBorders: false, bgDanger: true, bgSuccess: false }],
    ['0', { expensesBorders: true, incomeBorders: true, bgDanger: true, bgSuccess: false }],
    [false, { expensesBorders: true, incomeBorders: false, bgDanger: true, bgSuccess: false }],
    [1, { expensesBorders: false, incomeBorders: true, bgDanger: false, bgSuccess: true }],
    ['1', { expensesBorders: false, incomeBorders: true, bgDanger: false, bgSuccess: true }],
    [true, { expensesBorders: false, incomeBorders: true, bgDanger: false, bgSuccess: true }],
    [null, { expensesBorders: false, incomeBorders: false, bgDanger: false, bgSuccess: false }],
  ])('is_income = %j', (isIncome, expected) => {
    expect(classesFor(isIncome)).toEqual(expected);
  });
});
