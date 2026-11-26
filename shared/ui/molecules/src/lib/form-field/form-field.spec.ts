import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiInput } from '@shared/ui-atoms';
import { provideUiText } from '@shared/ui-tokens';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiFieldAction } from './field-action/field-action';
import { UiFieldAffix } from './field-affix/field-affix';
import { UiFormField } from './form-field';

const imports = [UiFormField, UiInput, UiFieldAffix, UiFieldAction, ReactiveFormsModule];

describe('ui-form-field', () => {
  it('links its label to the control, generating an id, and describes it with the hint', async () => {
    await render('<ui-form-field label="Nom du foyer" hint="Visible par les membres."><input uiInput /></ui-form-field>', { imports });
    const control = screen.getByRole('textbox', { name: 'Nom du foyer' });
    expect(control.id).toMatch(/^ui-form-field-\d+-control$/);
    expect(screen.getByRole('textbox', { description: 'Visible par les membres.' })).toBe(control);
  });

  it('keeps an id the page already set', async () => {
    await render('<ui-form-field label="Nom"><input uiInput id="name" /></ui-form-field>', { imports });
    expect(screen.getByRole('textbox', { name: 'Nom' }).id).toBe('name');
  });

  it('shows the error once touched and invalid, replacing the hint, with the UI_TEXT message', async () => {
    const name = new FormControl('', Validators.required);
    const { fixture } = await render(
      '<ui-form-field label="Nom" hint="Visible par les membres."><input uiInput [formControl]="name" /></ui-form-field>',
      { imports, componentProperties: { name } },
    );
    const control = screen.getByRole('textbox', { name: 'Nom' });
    expect(control.getAttribute('aria-invalid')).toBeNull();
    await userEvent.click(control);
    await userEvent.tab();
    fixture.detectChanges();
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('textbox', { description: 'Ce champ est obligatoire.' })).toBe(control);
    expect(screen.queryByText('Visible par les membres.')).toBeNull();
  });

  it('prefers the page message, then fills UI_TEXT placeholders from the error', async () => {
    const code = new FormControl('ab', [Validators.minLength(4)]);
    code.markAsTouched();
    await render('<ui-form-field label="Code" [errors]="{ pattern: \'Chiffres seulement.\' }"><input uiInput [formControl]="code" /></ui-form-field>', {
      imports,
      componentProperties: { code },
      providers: [provideUiText({ errors: { minlength: 'Au moins {{requiredLength}} caractères.' } })],
    });
    expect(screen.getByText('Au moins 4 caractères.')).toBeTruthy();
  });

  it('shows a counter from the control value', async () => {
    const name = new FormControl('Foyer');
    const { fixture } = await render('<ui-form-field label="Nom" [maxLength]="60"><input uiInput [formControl]="name" /></ui-form-field>', {
      imports,
      componentProperties: { name },
    });
    expect(screen.getByText('5/60')).toBeTruthy();
    await userEvent.type(screen.getByRole('textbox'), ' Sahli');
    fixture.detectChanges();
    expect(screen.getByText('11/60')).toBeTruthy();
  });

  it('appends the optional text to the label', async () => {
    await render('<ui-form-field label="Note" optional><input uiInput /></ui-form-field>', { imports });
    expect(screen.getByRole('textbox', { name: 'Note (facultatif)' })).toBeTruthy();
  });

  it('keeps a phone prefix and its control left-to-right', async () => {
    const { container } = await render('<ui-form-field label="Téléphone"><span uiPrefix>+216</span><input uiInput type="tel" /></ui-form-field>', {
      imports,
    });
    expect(screen.getByRole('textbox', { name: 'Téléphone' }).dir).toBe('ltr');
    expect((container.querySelector('[uiPrefix]') as HTMLElement).dir).toBe('ltr');
    expect(container.querySelector('ui-form-field')?.classList).toContain('ui-form-field--has-prefix');
  });

  it('places an inline action, such as show password', async () => {
    const { container } = await render(
      '<ui-form-field label="Mot de passe"><input uiInput type="password" /><button uiFieldAction aria-label="Afficher le mot de passe">o</button></ui-form-field>',
      { imports },
    );
    expect(screen.getByRole('button', { name: 'Afficher le mot de passe' }).getAttribute('type')).toBe('button');
    expect(container.querySelector('ui-form-field')?.classList).toContain('ui-form-field--has-action');
  });
});
