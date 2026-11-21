import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { DateInputComponent } from './date-input/date-input-component';
import { SelectComponent } from './select-component/select-component';
import { TextInput } from './text-input-component/text-input';

// spec 001 T12 (REQ-3.5c): the form controls must keep reflecting what a
// parent form does to them after switching to OnPush.
//
// The parent is OnPush (the Angular 22 default, and every app form after T15).
// Each case runs twice:
// - the parent re-renders itself (the action came from an event in the parent,
//   which marks it dirty), and
// - the parent does not re-render (the action came from elsewhere, e.g. an
//   effect): nothing re-checks the control for it, so it must redraw on its own.
//
// Change detection runs the way the app runs it: parent actions happen inside
// NgZone (as in an event handler), then autoDetectChanges + whenStable. Never
// detectChanges() on the control itself.
@Component({
  imports: [ReactiveFormsModule, TextInput, SelectComponent, DateInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <lib-text-input
        id="amount"
        formControlName="amount"
        [formControl]="form.controls.amount"
        [required]="true"
      />
      <lib-select
        id="categorie"
        formControlName="categorie"
        [options]="options"
        [showValid]="true"
      />
      <lib-date-input
        id="date"
        formControlName="date"
        [formControl]="form.controls.date"
        [required]="true"
      />
    </form>
  `,
})
class HostComponent {
  readonly cdr = inject(ChangeDetectorRef);
  options = [
    { label: 'Alimentation', value: 'c1' },
    { label: 'Transport', value: 'c2' },
  ];
  form = new FormGroup({
    amount: new FormControl('', Validators.required),
    categorie: new FormControl(''),
    date: new FormControl('', Validators.required),
  });
}

describe.each<[string, boolean]>([
  ['a parent that re-renders', true],
  ['a parent that does not re-render', false],
])('form controls driven by %s', (_name, parentRerenders) => {
  let fixture: ComponentFixture<HostComponent>;
  let form: HostComponent['form'];
  const el = <T extends Element>(selector: string): T =>
    fixture.nativeElement.querySelector(selector) as T;
  /** A parent action, run the way an event handler runs in the app. */
  const parent = async (action: () => void) => {
    TestBed.inject(NgZone).run(() => {
      action();
      if (parentRerenders) fixture.componentInstance.cdr.markForCheck();
    });
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    form = fixture.componentInstance.form;
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  describe('text-input', () => {
    it('shows a value set by the parent, and clears on reset', async () => {
      await parent(() => form.controls.amount.setValue('42.5'));
      expect(el<HTMLInputElement>('input#amount').value).toBe('42.5');

      await parent(() => form.reset());
      expect(el<HTMLInputElement>('input#amount').value).toBe('');
    });

    it('shows the required error when the parent marks the form touched', async () => {
      await parent(() => form.markAllAsTouched());
      expect(el('input#amount').classList).toContain('is-invalid');
    });

    it('clears the error once the parent sets a valid value', async () => {
      await parent(() => form.markAllAsTouched());
      await parent(() => form.controls.amount.setValue('10'));
      expect(el('input#amount').classList).not.toContain('is-invalid');
    });
  });

  describe('select', () => {
    // jsdom does not reflect option selection for this select (it renders
    // size="0"), so this checks the view redraw instead: with showValid, the
    // template adds `is-valid` once the control holds a value.
    it('redraws when the parent sets a value, and when it resets', async () => {
      expect(el('select').classList).not.toContain('is-valid');

      await parent(() => form.controls.categorie.setValue('c2'));
      expect(el('select').classList).toContain('is-valid');

      await parent(() => form.reset());
      expect(el('select').classList).not.toContain('is-valid');
    });
  });

  describe('date-input', () => {
    it('shows a date set by the parent, and clears on reset', async () => {
      await parent(() => form.controls.date.setValue('2026-11-21'));
      expect(el<HTMLInputElement>('input#date').value).toBe('2026-11-21');

      await parent(() => form.reset());
      expect(el<HTMLInputElement>('input#date').value).toBe('');
    });

    it('shows the required error when the parent marks the form touched', async () => {
      await parent(() => form.markAllAsTouched());
      expect(el('input#date').classList).toContain('is-invalid');
    });

    it('shows the required error after the user leaves the empty field', async () => {
      el<HTMLInputElement>('input#date').dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(el('input#date').classList).toContain('is-invalid');
    });
  });
});
