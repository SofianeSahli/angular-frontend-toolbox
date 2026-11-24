import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiSegmentedControl } from './segmented-control';

const options = [
  { value: 'expense', label: 'Dépense' },
  { value: 'income', label: 'Revenu' },
  { value: 'transfer', label: 'Transfert', disabled: true },
  { value: 'refund', label: 'Remboursement' },
];

async function setup(initial: string | null = 'expense') {
  const type = new FormControl<string | null>(initial);
  const result = await render('<ui-segmented-control [options]="options" ariaLabel="Type" [formControl]="type" />', {
    imports: [UiSegmentedControl, ReactiveFormsModule],
    componentProperties: { type, options },
  });
  return { type, ...result };
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('ui-segmented-control', () => {
  afterEach(() => document.documentElement.removeAttribute('dir'));

  it('is a named radio group showing the form value', async () => {
    await setup();
    expect(screen.getByRole('radiogroup', { name: 'Type' })).toBeTruthy();
    expect(radio('Dépense').getAttribute('aria-checked')).toBe('true');
    expect(radio('Dépense').getAttribute('tabindex')).toBe('0');
    expect(radio('Revenu').getAttribute('tabindex')).toBe('-1');
  });

  it('updates the form on click, and follows a value written by the form', async () => {
    const { type, fixture } = await setup();
    await userEvent.click(radio('Revenu'));
    expect(type.value).toBe('income');
    type.setValue('refund');
    fixture.detectChanges();
    expect(radio('Remboursement').getAttribute('aria-checked')).toBe('true');
  });

  it('moves and selects with the arrow keys, skipping disabled options, and Home/End jump', async () => {
    const { type } = await setup();
    radio('Dépense').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(type.value).toBe('income');
    await userEvent.keyboard('{ArrowRight}');
    expect(type.value).toBe('refund');
    expect(document.activeElement).toBe(radio('Remboursement'));
    await userEvent.keyboard('{Home}');
    expect(type.value).toBe('expense');
    await userEvent.keyboard('{End}');
    expect(type.value).toBe('refund');
  });

  it('mirrors the left and right arrows in RTL', async () => {
    document.documentElement.dir = 'rtl';
    const { type } = await setup();
    radio('Dépense').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(type.value).toBe('income');
  });

  it('disables every option when the form control is disabled', async () => {
    const { type, fixture } = await setup();
    type.disable();
    fixture.detectChanges();
    expect(screen.getAllByRole('radio').every((item) => (item as HTMLButtonElement).disabled)).toBe(true);
  });
});
