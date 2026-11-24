import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { olivierTheme } from '@shared/theme-olivier';
import { provideUi } from '@shared/ui-tokens';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { catalogRoutes } from './app.routes';

const settle = () => new Promise((resolve) => setTimeout(resolve));

async function open(url: string): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({ providers: [provideRouter(catalogRoutes), provideUi({ theme: olivierTheme })] });
  await TestBed.inject(ApplicationInitStatus).donePromise;
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  harness.detectChanges();
  return harness;
}

describe('ui-catalog routes', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    });
  });

  afterEach(() => {
    ['data-theme', 'data-bs-theme', 'data-accent', 'dir'].forEach((attribute) => document.documentElement.removeAttribute(attribute));
    localStorage.clear();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('shows the atoms page with the level navigation and the toolbar', async () => {
    await open('/');
    expect(screen.getByRole('navigation', { name: 'Niveaux' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Actions' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Atomes' }).getAttribute('aria-current')).toBe('page');
  });

  it('switches theme, accent and direction from the toolbar, and shows the Arabic samples in RTL', async () => {
    const harness = await open('/');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Thème' }), 'Sombre');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Accent' }), 'figue');
    expect(document.documentElement.getAttribute('data-accent')).toBe('figue');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sens' }), 'Droite à gauche');
    harness.detectChanges();
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('button', { name: 'إضافة مصروف' })).toBeTruthy();
  });

  it('shows the molecules page with its form bound to the molecules', async () => {
    const harness = await open('/molecules');
    expect(screen.getByRole('heading', { level: 2, name: 'Formulaire' })).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: 'Revenu' }));
    harness.detectChanges();
    expect(screen.getByLabelText('Valeur du formulaire').textContent).toContain('"type": "income"');
  });

  it('opens a dialog and a toast from the organisms page', async () => {
    const harness = await open('/organisms');
    await userEvent.click(screen.getByRole('button', { name: 'Dialogue' }));
    await settle();
    expect(screen.getByRole('dialog', { name: 'Nouvelle dépense' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await settle();
    await userEvent.click(screen.getByRole('button', { name: 'Toast succès' }));
    harness.detectChanges();
    expect(screen.getByRole('status', { name: '' }).textContent).toContain('Dépense ajoutée.');
  });

  it.each([
    ['/templates/app-shell', 'main', 'Novembre 2026'],
    ['/templates/page', 'complementary', 'À surveiller'],
    ['/templates/auth', 'main', 'Connexion'],
    ['/templates/flow', 'main', 'Créer votre foyer'],
  ])('shows %s full screen with a way back to the catalog', async (url, landmark, text) => {
    await open(url);
    expect(screen.getAllByRole(landmark).some((element) => element.textContent?.includes(text))).toBe(true);
    expect(screen.getByRole('link', { name: 'Retour au catalogue' }).getAttribute('href')).toBe('/');
  });
});
