import { render, screen } from '@testing-library/angular';
import { UiAvatarGroup } from './avatar-group';

const members = [{ name: 'Sofiane' }, { name: 'Amira', member: 2 as const }, { name: 'Youssef', member: 3 as const }, { name: 'Leïla' }, { name: 'Nour' }];

describe('ui-avatar-group', () => {
  it('shows up to max avatars and a +N bubble, named by every member', async () => {
    const { container } = await render('<ui-avatar-group [members]="members" [max]="3" />', {
      imports: [UiAvatarGroup],
      componentProperties: { members },
    });
    expect(screen.getByRole('img', { name: 'Sofiane, Amira, Youssef, Leïla, Nour' })).toBeTruthy();
    expect(container.querySelectorAll('ui-avatar')).toHaveLength(3);
    expect(container.querySelector('.ui-avatar-group__more')?.textContent).toBe('+2');
  });

  it('has no bubble when every member fits, and keeps the avatars decorative', async () => {
    const { container } = await render('<ui-avatar-group [members]="members" [max]="5" size="md" />', {
      imports: [UiAvatarGroup],
      componentProperties: { members },
    });
    expect(container.querySelector('.ui-avatar-group__more')).toBeNull();
    expect(Array.from(container.querySelectorAll('ui-avatar')).every((avatar) => avatar.getAttribute('aria-hidden') === 'true')).toBe(true);
  });
});
