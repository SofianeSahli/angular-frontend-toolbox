import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartItem } from './chart-item';

describe('ChartItem', () => {
  let component: ChartItem;
  let fixture: ComponentFixture<ChartItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartItem],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
