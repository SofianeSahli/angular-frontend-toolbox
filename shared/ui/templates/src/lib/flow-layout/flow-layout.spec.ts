import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiFlowLayout } from './flow-layout';

async function setup(steps: number) {
  const back = vi.fn();
  const close = vi.fn();
  const result = await render(
    `<ui-flow-layout title="Créer votre foyer" lead="Vous pourrez inviter les membres ensuite." [step]="1" [steps]="${steps}" (back)="back()" (exit)="close()">
       <p>Formulaire</p>
       <button uiFlowFooter>Continuer</button>
     </ui-flow-layout>`,
    { imports: [UiFlowLayout], componentProperties: { back, close } },
  );
  return { back, close, ...result };
}

describe('ui-flow-layout', () => {
  it('has an h1 title, a lead, the content in main and a footer action', async () => {
    await setup(2);
    expect(screen.getByRole('heading', { level: 1, name: 'Créer votre foyer' })).toBeTruthy();
    expect(screen.getByRole('main').textContent).toContain('Vous pourrez inviter les membres ensuite.');
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeTruthy();
  });

  it('emits back and close from named buttons', async () => {
    const { back, close } = await setup(2);
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('shows the stepper only when there are several steps', async () => {
    await setup(2);
    expect(screen.getByText('Étape 1 sur 2')).toBeTruthy();
  });

  it('hides the stepper for a single step', async () => {
    await setup(1);
    expect(screen.queryByText(/Étape/)).toBeNull();
  });
});
