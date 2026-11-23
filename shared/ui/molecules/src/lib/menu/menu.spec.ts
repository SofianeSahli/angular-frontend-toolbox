import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiMenu, UiMenuItem, UiMenuItemRadio, UiMenuTrigger } from './menu';

const imports = [UiMenuTrigger, UiMenu, UiMenuItem, UiMenuItemRadio];

const ARROW_DOWN_KEY_CODE = 40;
const ESCAPE_KEY_CODE = 27;

// CDK menus read the legacy KeyboardEvent.keyCode, which user-event leaves at 0 in jsdom.
function pressKeyCdkReads(key: string, keyCode: number): void {
  fireEvent.keyDown(document.activeElement as Element, { key, keyCode });
}

async function setup() {
  const edit = vi.fn();
  const remove = vi.fn();
  const result = await render(
    `<button type="button" [uiMenuTriggerFor]="actions">Actions</button>
     <ng-template #actions>
       <ui-menu>
         <button uiMenuItem icon="pencil" (triggered)="edit()">Modifier</button>
         <button uiMenuItem danger icon="trash" (triggered)="remove()">Supprimer</button>
         <button uiMenuItem [checked]="true">Carnet du foyer</button>
         <button uiMenuItem [checked]="false">Carnet perso</button>
       </ui-menu>
     </ng-template>`,
    { imports, componentProperties: { edit, remove } },
  );
  return { edit, remove, trigger: screen.getByRole('button', { name: 'Actions' }), ...result };
}

describe('ui-menu', () => {
  it('opens from its trigger with menu items, a danger item and checked items', async () => {
    const { trigger } = await setup();
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Modifier' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Supprimer' }).classList).toContain('ui-menu-item--danger');
    expect(screen.getByRole('menuitemradio', { name: 'Carnet du foyer' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', { name: 'Carnet perso' }).getAttribute('aria-checked')).toBe('false');
  });

  it('runs an item and closes', async () => {
    const { trigger, edit } = await setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Modifier' }));
    expect(edit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('moves with the arrow keys and closes with Escape, returning focus to the trigger', async () => {
    const { trigger, fixture } = await setup();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Modifier' }));
    pressKeyCdkReads('ArrowDown', ARROW_DOWN_KEY_CODE);
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Supprimer' }));
    pressKeyCdkReads('Escape', ESCAPE_KEY_CODE);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
