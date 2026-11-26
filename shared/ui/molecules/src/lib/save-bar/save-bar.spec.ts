import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiSaveBar } from './save-bar';

async function setup() {
  const shown = signal(true);
  const busy = signal(false);
  const primary = vi.fn();
  const secondary = vi.fn();
  const view = await render(
    `@if (shown()) {
       <ui-save-bar text="1 modification" primaryLabel="Enregistrer" secondaryLabel="Annuler" [busy]="busy()" (primary)="primary()" (secondary)="secondary()" />
     }`,
    { imports: [UiSaveBar], componentProperties: { shown, busy, primary, secondary } },
  );
  return { view, shown, busy, primary, secondary };
}

describe('ui-save-bar', () => {
  it('announces its text politely and offers both actions', async () => {
    const { primary, secondary } = await setup();
    expect(screen.getByRole('status').textContent?.trim()).toBe('1 modification');
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(secondary).toHaveBeenCalledTimes(1);
    expect(primary).toHaveBeenCalledTimes(1);
  });

  it('disables the secondary action while busy', async () => {
    const { view, busy } = await setup();
    busy.set(true);
    view.detectChanges();
    expect((screen.getByRole('button', { name: 'Annuler' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps focused content clear of itself while shown', async () => {
    const { view, shown } = await setup();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('scroll-padding-block-end')).toMatch(/px$/);
    shown.set(false);
    view.detectChanges();
    expect(root.style.getPropertyValue('scroll-padding-block-end')).toBe('');
  });
});
