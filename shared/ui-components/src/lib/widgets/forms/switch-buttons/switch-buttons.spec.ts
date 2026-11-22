import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SwitchButtons, SwitchOption } from './switch-buttons';

// Same usage as Summary and Parameters: a parent signal bound with [(value)].
@Component({
  imports: [SwitchButtons],
  template: `<lib-switch-buttons [(value)]="selected" [options]="options" />`,
})
class HostComponent {
  selected = signal('1');
  options: SwitchOption[] = [
    { label: 'labels.incomes', value: '1' },
    { label: 'labels.expenses', value: '0' },
  ];
}

describe('SwitchButtons', () => {
  let fixture: ComponentFixture<HostComponent>;
  const labelFor = (value: string): HTMLLabelElement =>
    fixture.nativeElement.querySelector(`label[for="${value}"]`);
  const radioFor = (value: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[id="${value}"]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('checks and highlights the option the parent selected', () => {
    expect(radioFor('1').checked).toBe(true);
    expect(labelFor('1').className).toContain('btn-primary');
    expect(labelFor('0').className).toContain('btn-outline-primary');
  });

  it('follows a new value set by the parent', async () => {
    fixture.componentInstance.selected.set('0');
    await fixture.whenStable();

    expect(radioFor('0').checked).toBe(true);
    expect(labelFor('0').className).toContain('btn-primary');
    expect(labelFor('1').className).toContain('btn-outline-primary');
  });

  it('writes the clicked option back to the parent', async () => {
    radioFor('0').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selected()).toBe('0');
    expect(labelFor('0').className).toContain('btn-primary');
  });
});
