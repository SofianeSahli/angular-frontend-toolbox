import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../testing/test-providers';
import { Parameters } from './parameters';

describe('Parameters', () => {
  let fixture: ComponentFixture<Parameters>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Parameters],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Parameters);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
