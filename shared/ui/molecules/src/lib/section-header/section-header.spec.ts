import { render, screen } from '@testing-library/angular';
import { UiSectionHeader } from './section-header';

describe('ui-section-header', () => {
  it('is a level-2 heading by default, with its end content', async () => {
    await render('<ui-section-header title="À surveiller"><a href="#all">Tout voir</a></ui-section-header>', { imports: [UiSectionHeader] });
    expect(screen.getByRole('heading', { level: 2, name: 'À surveiller' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Tout voir' })).toBeTruthy();
  });

  it.each([3, 4, 5, 6])('renders level %d without changing the look', async (level) => {
    await render(`<ui-section-header title="Récents" [level]="${level}" />`, { imports: [UiSectionHeader] });
    const heading = screen.getByRole('heading', { level, name: 'Récents' });
    expect(heading.classList).toContain('ui-section-header__title');
  });
});
