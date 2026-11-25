import { screen } from '@testing-library/angular';
import { TND, memberDto, renderPart, summary } from '../testing';
import { MembersCard, showsMembers } from './members-card';

describe('MembersCard (spec 008 REQ-3.4)', () => {
  it('lists members in API order, without links', async () => {
    await renderPart(MembersCard, { summary: summary({ members: [memberDto('u2', 'Sami', 100), memberDto('u1', 'Moi', 900)] }), currency: TND });
    expect(screen.getAllByRole('listitem').map((row) => row.querySelector('.ui-bar-list__label')?.textContent)).toEqual(['Sami', 'Moi']);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows only for a household with more than one member', () => {
    expect(showsMembers(false, 'ready', summary())).toBe(false);
    expect(showsMembers(true, 'ready', summary())).toBe(true);
    expect(showsMembers(true, 'ready', summary({ members: [memberDto('u1', 'Moi', 1)] }))).toBe(false);
    expect(showsMembers(true, 'loading', null)).toBe(true);
  });
});
