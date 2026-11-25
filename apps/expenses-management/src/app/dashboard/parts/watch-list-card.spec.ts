import { screen } from '@testing-library/angular';
import { budget, lineDto } from '../../budget/testing';
import { TND, renderPart, visibleText } from '../testing';
import { WatchListCard } from './watch-list-card';

describe('WatchListCard (spec 008 REQ-3.2)', () => {
  it('lists at most three lines to watch, each with a meter and a link to its operations', async () => {
    await renderPart(WatchListCard, { lines: budget().lines, currency: TND, month: '2026-11' });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute('href')).toBe('/operations?mois=2026-11&categorie=entertainment.outings');
    expect(screen.getAllByRole('meter').map((meter) => meter.getAttribute('aria-label'))).toEqual([
      'Nom entertainment.outings',
      'Nom transport',
      'Nom home.housing',
    ]);
    expect(visibleText()).toContain('160 %');
    expect(visibleText()).toContain('Hors plan');
  });

  it('says all is fine when no line qualifies', async () => {
    await renderPart(WatchListCard, { lines: budget({ lines: [lineDto('food', { status: 'ok', percent: 10 })] }).lines, currency: TND, month: '2026-11' });
    expect(visibleText()).toContain('Tout est dans les clous ce mois-ci');
    expect(screen.queryByRole('meter')).toBeNull();
  });
});
