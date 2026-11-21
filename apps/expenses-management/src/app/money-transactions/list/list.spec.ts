import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { List } from './list';

describe('List', () => {
  let fixture: ComponentFixture<List>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [List],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(List);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
