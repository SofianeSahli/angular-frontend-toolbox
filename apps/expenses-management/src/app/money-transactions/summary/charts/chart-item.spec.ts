import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../../testing/test-providers';
import { ChartItem } from './chart-item';

describe('ChartItem', () => {
  let fixture: ComponentFixture<ChartItem>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ChartItem],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(ChartItem);
    fixture.componentRef.setInput('values', [100, 40, 20]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
