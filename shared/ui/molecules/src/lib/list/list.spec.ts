import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiList } from './list';
import { UiListItem } from './list-item/list-item';

describe('ui-list and uiListItem', () => {
  it('renders a list of rows with title, subtitle and trailing content', async () => {
    await render(
      `<ui-list>
         <li uiListItem><span uiLeading>🛒</span><span uiTitle>Carrefour Market</span><span uiSubtitle>Alimentation</span><span uiTrailing>48,350 DT</span></li>
         <li uiListItem><span uiTitle>Pharmacie</span></li>
       </ui-list>`,
      { imports: [UiList, UiListItem] },
    );
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Carrefour Market');
    expect(items[0].textContent).toContain('48,350 DT');
  });

  it('makes a whole button row the touch target', async () => {
    const opened = vi.fn();
    await render('<ui-list><li><button uiListItem (click)="opened()"><span uiTitle>Carrefour Market</span></button></li></ui-list>', {
      imports: [UiList, UiListItem],
      componentProperties: { opened },
    });
    const row = screen.getByRole('button', { name: 'Carrefour Market' });
    row.focus();
    await userEvent.keyboard('{Enter}');
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('makes a whole link row the touch target', async () => {
    await render('<ui-list><li><a uiListItem href="#tx-1"><span uiTitle>Loyer</span></a></li></ui-list>', { imports: [UiList, UiListItem] });
    expect(screen.getByRole('link', { name: 'Loyer' }).getAttribute('href')).toBe('#tx-1');
  });
});
