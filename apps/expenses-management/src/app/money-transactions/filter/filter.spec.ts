import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { Filter } from './filter';

describe('Filter', () => {
  let fixture: ComponentFixture<Filter>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Filter],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Filter);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
