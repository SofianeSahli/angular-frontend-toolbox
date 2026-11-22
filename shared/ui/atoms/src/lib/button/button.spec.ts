import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiButton } from './button';

describe('uiButton', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is a secondary, medium button by default, named by its label', async () => {
    await render('<button uiButton>Annuler</button>', { imports: [UiButton] });
    const button = screen.getByRole('button', { name: 'Annuler' });
    expect(button.className).not.toMatch(/ui-button--(primary|ghost|danger|sm|lg)/);
  });

  it.each([
    ['variant="primary"', 'ui-button--primary'],
    ['variant="ghost"', 'ui-button--ghost'],
    ['variant="danger"', 'ui-button--danger'],
    ['size="sm"', 'ui-button--sm'],
    ['size="lg"', 'ui-button--lg'],
  ])('applies %s', async (attribute, cssClass) => {
    await render(`<button uiButton ${attribute}>Ajouter</button>`, { imports: [UiButton] });
    expect(screen.getByRole('button').classList).toContain(cssClass);
  });

  it('is natively disabled on a button and keeps its label', async () => {
    const clicked = vi.fn();
    await render('<button uiButton disabled (click)="clicked()">Enregistrer</button>', {
      imports: [UiButton],
      componentProperties: { clicked },
    });
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button).toHaveProperty('disabled', true);
    await userEvent.click(button);
    expect(clicked).not.toHaveBeenCalled();
  });

  it('blocks a disabled link and takes it out of the tab order', async () => {
    const clicked = vi.fn();
    await render('<a uiButton href="#x" disabled (click)="clicked()">Voir tout</a>', {
      imports: [UiButton],
      componentProperties: { clicked },
    });
    const link = screen.getByRole('link', { name: 'Voir tout' });
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    await userEvent.click(link);
    expect(clicked).not.toHaveBeenCalled();
  });

  it('while loading: busy, spinner shown, label kept, click and keyboard ignored', async () => {
    const clicked = vi.fn();
    await render('<button uiButton loading (click)="clicked()">Enregistrement…</button>', {
      imports: [UiButton],
      componentProperties: { clicked },
    });
    const button = screen.getByRole('button', { name: 'Enregistrement…' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('ui-spinner')).toBeTruthy();
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicked).not.toHaveBeenCalled();
  });

  it('activates with the keyboard when idle', async () => {
    const clicked = vi.fn();
    await render('<button uiButton (click)="clicked()">Ajouter</button>', { imports: [UiButton], componentProperties: { clicked } });
    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(clicked).toHaveBeenCalledTimes(2);
  });

  it('reports an icon-only button without a name, and accepts one with an aria-label', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await render('<button uiButton iconOnly>+</button><button uiButton iconOnly aria-label="Rechercher">o</button>', {
      imports: [UiButton],
    });
    expect(report).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Rechercher' }).classList).toContain('ui-button--icon-only');
  });
});
