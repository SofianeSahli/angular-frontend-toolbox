import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiOptionCards } from './option-cards';

const options = [
  { value: 'household', title: 'Un foyer', description: 'Partagez les dépenses avec les membres.', icon: 'house' },
  { value: 'solo', title: 'Moi seulement', description: 'Suivez vos dépenses personnelles.' },
];

async function setup(control: FormControl<string | null>) {
  return render('<ui-option-cards [options]="options" legend="Pour commencer" [formControl]="start" />', {
    imports: [UiOptionCards, ReactiveFormsModule],
    componentProperties: { start: control, options },
  });
}

describe('ui-option-cards', () => {
  it('is a fieldset named by its legend, with one radio per card', async () => {
    await setup(new FormControl<string | null>(null));
    const group = screen.getByRole('group', { name: 'Pour commencer' });
    expect(group.tagName).toBe('FIELDSET');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('writes the chosen card to the form and reads the form value', async () => {
    const start = new FormControl<string | null>('solo');
    await setup(start);
    expect(screen.getByRole('radio', { name: /Moi seulement/ })).toHaveProperty('checked', true);
    await userEvent.click(screen.getByText('Un foyer'));
    expect(start.value).toBe('household');
  });

  it('moves the choice with the native radio keyboard', async () => {
    const start = new FormControl<string | null>('household');
    await setup(start);
    screen.getByRole('radio', { name: /Un foyer/ }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(start.value).toBe('solo');
  });

  it('is disabled with its form control', async () => {
    await setup(new FormControl<string | null>({ value: null, disabled: true }));
    expect((screen.getByRole('group') as HTMLFieldSetElement).disabled).toBe(true);
  });
});
