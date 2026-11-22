// The app registers Chart.js controllers through chart-item's 'chart.js/auto'
// import; bar-chart relies on that (known issue). Mirror it here.
import { Chart } from 'chart.js/auto';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../../testing/test-providers';
import { BarChart } from './bar-chart';

describe('BarChart', () => {
  let fixture: ComponentFixture<BarChart>;

  beforeEach(async () => {
    localStorage.clear();
    // jsdom has no canvas: with no 2D context, Chart.js skips drawing.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    // ...and a chart without a context can't update(); drawing isn't under test here.
    vi.spyOn(Chart.prototype, 'update').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [BarChart],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(BarChart);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
