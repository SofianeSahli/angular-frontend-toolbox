import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SummaryItem } from './summary-item';

describe('SummaryItem', () => {
  let fixture: ComponentFixture<SummaryItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryItem],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryItem);
    fixture.componentRef.setInput('moneyAmount', 1250);
    fixture.componentRef.setInput('moneyEntriescount', 3);
    fixture.componentRef.setInput('lineType', 'expense');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('uses the expense labels for an expense line', () => {
    expect(fixture.componentInstance.getSummaryLabels()).toEqual({
      titleKey: 'text.summary_expenses',
      amountKey: 'labels.total_expenses_amount',
      entriesKey: 'labels.number_expenses_entries',
    });
  });
});
