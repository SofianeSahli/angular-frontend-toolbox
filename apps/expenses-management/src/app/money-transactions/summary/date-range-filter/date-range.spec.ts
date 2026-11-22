import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../../testing/test-providers';
import { DateRange } from './date-range';

describe('DateRange', () => {
  let fixture: ComponentFixture<DateRange>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DateRange],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(DateRange);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
