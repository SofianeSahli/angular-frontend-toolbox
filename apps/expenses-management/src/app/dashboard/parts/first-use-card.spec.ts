import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderPart } from '../testing';
import { FirstUseCard } from './first-use-card';

describe('FirstUseCard (spec 008 REQ-4.4)', () => {
  it('offers to add an entry and to prepare the budget', async () => {
    const add = vi.fn();
    await renderPart(FirstUseCard, {}, { add });
    await userEvent.click(screen.getByRole('button', { name: /Ajouter une opération/ }));
    expect(add).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Préparer le budget' }).getAttribute('href')).toBe('/budget');
  });
});
