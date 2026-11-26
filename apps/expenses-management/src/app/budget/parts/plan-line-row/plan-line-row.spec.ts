import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { withoutUnit } from '../../support/amounts';
import { PlanLineRow } from './plan-line-row';

const base = { name: 'Transport', text: '100,000', actual: 160000, currency: TND };

describe('PlanLineRow (spec 009 REQ-9.3, 9.4)', () => {
  it('shows planned, actual and gap with a meter, and opens on tap', async () => {
    const open = vi.fn();
    await renderPart(PlanLineRow, base, { open });
    expect(screen.getByRole('meter', { name: 'Transport' }).getAttribute('aria-valuenow')).toBe('160000');
    expect(visibleText()).toContain(withoutUnit(100000, TND));
    expect(visibleText()).toContain(withoutUnit(-60000, TND, { signed: true }));
    expect(document.querySelector('.line__amount--over ui-icon')).toBeTruthy();
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toMatch(/^Transport, prévu .*, dépensé .*, Dépassé$/);
    await userEvent.click(button);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('never marks a row without a limit as over', async () => {
    await renderPart(PlanLineRow, { ...base, limit: false });
    expect(document.querySelector('.line__amount--over')).toBeNull();
    expect(screen.getByRole('button').getAttribute('aria-label')).not.toContain('Dépassé');
  });

  it('shows last month as plain text, zero included, and nothing when unknown (spec 008 REQ-9.14)', async () => {
    const view = await renderPart(PlanLineRow, { ...base, lastMonth: 0 });
    expect(visibleText()).toContain(`Le mois dernier : ${formatMinor(0, TND)}`);
    view.fixture.componentRef.setInput('lastMonth', null);
    view.detectChanges();
    expect(visibleText()).not.toContain('Le mois dernier');
  });

  it('shows a tag, an unreadable amount as a dash and a line error', async () => {
    await renderPart(PlanLineRow, { ...base, text: 'abc', tag: 'Retirée', error: 'Montant invalide' });
    expect(visibleText()).toContain('Retirée');
    expect(visibleText()).toContain('—');
    expect(visibleText()).toContain('Montant invalide');
  });
});
