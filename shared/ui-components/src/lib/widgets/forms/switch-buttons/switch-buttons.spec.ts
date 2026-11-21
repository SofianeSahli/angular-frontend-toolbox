import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SwitchButtons } from './switch-buttons';

describe('SwitchButtons', () => {
  let fixture: ComponentFixture<SwitchButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchButtons],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchButtons);
    fixture.componentRef.setInput('options', [
      { label: 'labels.incomes', value: '1' },
      { label: 'labels.expenses', value: '0' },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
