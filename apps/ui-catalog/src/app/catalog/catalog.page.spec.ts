import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { olivierTheme } from '@shared/theme-olivier';
import { provideUi } from '@shared/ui-tokens';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CatalogPage } from './catalog.page';

async function renderCatalog() {
  const result = await render(CatalogPage, { providers: [provideUi({ theme: olivierTheme })] });
  await TestBed.inject(ApplicationInitStatus).donePromise;
  return result;
}

describe('CatalogPage', () => {
  afterEach(() => {
    ['data-theme', 'data-bs-theme', 'data-accent', 'dir'].forEach((a) => document.documentElement.removeAttribute(a));
    localStorage.clear();
  });

  it('shows the three groups of atoms', async () => {
    await renderCatalog();
    for (const name of ['Actions', 'Champs de formulaire', 'Affichage']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy();
    }
  });

  it('switches the theme and the accent through the theme service', async () => {
    await renderCatalog();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Thème' }), 'Sombre');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Accent' }), 'figue');
    expect(document.documentElement.getAttribute('data-accent')).toBe('figue');
  });

  it('switches the direction and shows the Arabic samples in RTL', async () => {
    const { fixture } = await renderCatalog();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sens' }), 'Droite à gauche');
    fixture.detectChanges();
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('button', { name: 'إضافة مصروف' })).toBeTruthy();
  });

  it('binds the Angular form to the native atoms', async () => {
    const { fixture } = await renderCatalog();
    await userEvent.click(screen.getAllByRole('switch', { name: 'Rappel du soir' })[1]);
    fixture.detectChanges();
    expect(screen.getByLabelText('Valeur du formulaire').textContent).toContain('"reminder": true');
  });
});
