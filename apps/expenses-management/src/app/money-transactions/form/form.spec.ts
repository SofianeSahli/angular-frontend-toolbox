import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appTestProviders } from '../../../testing/test-providers';
import { Form } from './form';

describe('Form', () => {
  let fixture: ComponentFixture<Form>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Form],
      providers: appTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Form);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
