import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../../public/i18n/fr.json';
import { member } from '../../testing';
import { MembersList } from './members-list';

const t = fr.households.household;

async function renderList(canRemove: boolean) {
  const remove = vi.fn();
  const view = await render(MembersList, {
    providers: [provideTranslateService({ lang: 'fr' })],
    inputs: { members: [member('u1', 'owner'), member('u2'), member('u3')], selfId: 'u1', canRemove },
    on: { remove },
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.detectChanges();
  return { remove };
}

describe('MembersList', () => {
  it('lists members in the given order with a role badge and "(vous)" on the own row', async () => {
    await renderList(false);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Personne u1');
    expect(rows[0].textContent).toContain(t.you);
    expect(rows[0].textContent).toContain(t.owner);
    expect(rows[1].textContent).toContain(t.member);
    expect(rows[1].textContent).not.toContain(t.you);
    expect(screen.getByText('Personne u2').tagName).toBe('BDI');
  });

  it('offers no remove button when the user cannot remove', async () => {
    await renderList(false);
    expect(screen.queryByRole('button', { name: new RegExp(t.remove) })).toBeNull();
  });

  it('offers remove in an options menu on every other member, never on the own row (spec 009, écran 12)', async () => {
    const { remove } = await renderList(true);
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).queryByRole('button')).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Options pour/ })).toHaveLength(2);
    await userEvent.click(within(rows[2]).getByRole('button', { name: /^Options pour/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: t.remove }));
    expect(remove).toHaveBeenCalledWith(member('u3'));
  });
});
