import { fireEvent, render, screen } from '@testing-library/angular';
import { UiAvatar } from './avatar';

describe('ui-avatar', () => {
  it('shows the initial and is named by the member', async () => {
    await render('<ui-avatar name=" sofiane" />', { imports: [UiAvatar] });
    expect(screen.getByRole('img', { name: 'sofiane' }).textContent?.trim()).toBe('S');
  });

  it('keeps a whole letter for Arabic names', async () => {
    await render('<ui-avatar name="أمينة" />', { imports: [UiAvatar] });
    expect(screen.getByRole('img').textContent?.trim()).toBe('أ');
  });

  it('shows the photo, and the initial again when the photo fails', async () => {
    const { container, fixture } = await render('<ui-avatar name="Amira" src="/photo.jpg" />', { imports: [UiAvatar] });
    const photo = container.querySelector('img');
    expect(photo?.getAttribute('src')).toBe('/photo.jpg');
    fireEvent.error(photo as HTMLImageElement);
    fixture.detectChanges();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Amira' }).textContent?.trim()).toBe('A');
  });

  it('is hidden from assistive technology when decorative', async () => {
    const { container } = await render('<ui-avatar name="Sofiane" decorative size="sm" />', { imports: [UiAvatar] });
    const avatar = container.querySelector('ui-avatar');
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(avatar?.getAttribute('role')).toBeNull();
    expect(avatar?.classList).toContain('ui-avatar--sm');
  });

  it.each([
    [2, 'ui-avatar--member-2'],
    [3, 'ui-avatar--member-3'],
  ])('keeps member %d in its colour', async (member, cssClass) => {
    await render(`<ui-avatar name="Youssef" [member]="${member}" />`, { imports: [UiAvatar] });
    expect(screen.getByRole('img').classList).toContain(cssClass);
  });
});
