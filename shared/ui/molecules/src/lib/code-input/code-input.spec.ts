import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiCodeInput } from './code-input';

async function setup(code = new FormControl<string | null>('')) {
  const completed = vi.fn();
  const result = await render('<ui-code-input ariaLabel="Code reçu par e-mail" [formControl]="code" (completed)="completed($event)" />', {
    imports: [UiCodeInput, ReactiveFormsModule],
    componentProperties: { code, completed },
  });
  const cells = () => Array.from(result.container.querySelectorAll('.ui-code-input__cell'), (cell) => cell.textContent);
  return { code, completed, cells, ...result };
}

describe('ui-code-input', () => {
  it('has one real, named, numeric input with one-time-code autofill; the cells are hidden', async () => {
    const { container } = await setup();
    const input = screen.getByRole('textbox', { name: 'Code reçu par e-mail' });
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(container.querySelectorAll('.ui-code-input__cell[aria-hidden="true"]')).toHaveLength(6);
  });

  it('keeps digits only from a paste, mirrors them in the cells, and emits completed when full', async () => {
    const { code, completed, cells, fixture } = await setup();
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.paste('12 34-56');
    fixture.detectChanges();
    expect(code.value).toBe('123456');
    expect(cells()).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(completed).toHaveBeenCalledWith('123456');
  });

  it('shows a value written by the form', async () => {
    const { cells, code, fixture } = await setup();
    code.setValue('42');
    fixture.detectChanges();
    expect(cells()).toEqual(['4', '2', '', '', '', '']);
  });

  it('styles every cell as invalid once touched and invalid', async () => {
    const { container, fixture } = await setup(new FormControl<string | null>('', Validators.minLength(6)));
    await userEvent.type(screen.getByRole('textbox'), '12');
    await userEvent.tab();
    fixture.detectChanges();
    expect(container.querySelector('ui-code-input')?.classList).toContain('ui-code-input--invalid');
  });

  it('stays left-to-right in RTL pages', async () => {
    const { container } = await setup();
    expect(container.querySelector('ui-code-input')?.getAttribute('dir')).toBe('ltr');
  });

  it('is disabled with its form control', async () => {
    await setup(new FormControl<string | null>({ value: '', disabled: true }));
    expect(screen.getByRole('textbox')).toHaveProperty('disabled', true);
  });
});
