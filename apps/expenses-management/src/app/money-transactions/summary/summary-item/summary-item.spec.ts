import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryItem } from './summary-item';

describe('SummaryItem', () => {
  let component: SummaryItem;
  let fixture: ComponentFixture<SummaryItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryItem],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
