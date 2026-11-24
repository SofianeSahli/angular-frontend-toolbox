import { TestBed } from '@angular/core/testing';
import { UiIconRegistry } from '@shared/ui-atoms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiAlert } from './alert';

describe('ui-alert', () => {
  it.each([
    ['info', 'status', 'info'],
    ['success', 'status', 'circle-check'],
    ['warning', 'status', 'triangle-exclamation-point'],
    ['danger', 'alert', 'circle-x'],
  ])('%s: role %s and its own icon', async (tone, role, icon) => {
    const { container } = await render(`<ui-alert tone="${tone}">Message</ui-alert>`, { imports: [UiAlert] });
    expect(screen.getByRole(role).classList).toContain(`ui-alert--${tone}`);
    const expectedShapes = TestBed.inject(UiIconRegistry).find(icon)?.nodes.length;
    expect(container.querySelector('.ui-alert__icon svg')?.children.length).toBe(expectedShapes);
  });

  it('shows its title and message', async () => {
    await render('<ui-alert title="Budget dépassé">Alimentation : 112 %.</ui-alert>', { imports: [UiAlert] });
    expect(screen.getByRole('status').textContent).toContain('Budget dépassé');
    expect(screen.getByRole('status').textContent).toContain('Alimentation : 112 %.');
  });

  it('can be dismissed with a close button named by UI_TEXT', async () => {
    const dismissed = vi.fn();
    await render('<ui-alert dismissible (dismissed)="dismissed()">Enregistré.</ui-alert>', {
      imports: [UiAlert],
      componentProperties: { dismissed },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(dismissed).toHaveBeenCalledTimes(1);
  });

  it('has no close button unless dismissible', async () => {
    await render('<ui-alert>Enregistré.</ui-alert>', { imports: [UiAlert] });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
