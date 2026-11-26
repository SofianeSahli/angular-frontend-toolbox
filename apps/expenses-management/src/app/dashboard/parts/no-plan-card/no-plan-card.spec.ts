import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@shared/http-data-access';
import { TND, renderPart, visibleText } from '../../testing';
import { formatWhole } from '../../support/whole-units';
import { NoPlanCard } from './no-plan-card';

const text = () => visibleText();

describe('NoPlanCard (spec 008 REQ-4.1–4.3)', () => {
  it('compares with the same day of the previous month in neutral words', async () => {
    await renderPart(NoPlanCard, { comparison: { current: 500000, previous: 300000 }, currency: TND, month: '2026-11', position: 'current' });
    expect(screen.getByRole('heading', { name: 'Dépensé ce mois' })).toBeTruthy();
    expect(text()).toContain(formatWhole(500000, TND));
    expect(text()).toContain('Le mois dernier à la même date');
    expect(text()).toContain(`${formatWhole(200000, TND)} de plus`);
    expect(text()).not.toContain('Reste à dépenser');
  });

  it('compares whole months for another month', async () => {
    await renderPart(NoPlanCard, { comparison: { current: 100000, previous: 300000 }, currency: TND, month: '2026-09', position: 'past' });
    expect(text()).toContain('Le mois précédent');
    expect(text()).toContain(`${formatWhole(200000, TND)} de moins`);
  });

  it('shows the amount alone when the previous month is unknown', async () => {
    await renderPart(NoPlanCard, { comparison: { current: 500000, previous: null }, currency: TND, month: '2026-11' });
    expect(text()).toContain(formatWhole(500000, TND));
    expect(text()).not.toContain('Le mois dernier');
  });

  it('invites to set a budget for the month', async () => {
    await renderPart(NoPlanCard, { comparison: null, currency: TND, month: '2026-11' });
    expect(screen.getByRole('link', { name: 'Fixer un budget' }).getAttribute('href')).toBe('/budget?mois=2026-11');
  });

  it('shows an error with a retry', async () => {
    const retry = vi.fn();
    await renderPart(
      NoPlanCard,
      { comparison: null, currency: TND, month: '2026-11', status: 'error', error: new ApiError('offline', 0, 'http.offline', {}, null, '') },
      { retry },
    );
    expect(text()).toContain('Hors connexion');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalled();
  });
});
