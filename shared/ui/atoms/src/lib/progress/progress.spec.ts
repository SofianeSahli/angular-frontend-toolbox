import { render, screen } from '@testing-library/angular';
import { UiProgress } from './progress';

function bar(): HTMLElement {
  return screen.getByRole('progressbar').querySelector('.ui-progress__bar') as HTMLElement;
}

describe('ui-progress', () => {
  it('is a named progress bar with its values', async () => {
    await render('<ui-progress [value]="74" label="Budget du mois" />', { imports: [UiProgress] });
    const progress = screen.getByRole('progressbar', { name: 'Budget du mois' });
    expect([progress.getAttribute('aria-valuenow'), progress.getAttribute('aria-valuemin'), progress.getAttribute('aria-valuemax')]).toEqual([
      '74',
      '0',
      '100',
    ]);
    expect(bar().style.inlineSize).toBe('74%');
  });

  it('fills the bar when over the limit and still reports the real value', async () => {
    await render('<ui-progress [value]="112" label="Cafés et resto" tone="danger" />', { imports: [UiProgress] });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('112');
    expect(screen.getByRole('progressbar').classList).toContain('ui-progress--danger');
    expect(bar().style.inlineSize).toBe('100%');
  });

  it('uses its max and the tone the page chooses', async () => {
    await render('<ui-progress [value]="45" [max]="50" label="Alimentation" tone="warning" />', { imports: [UiProgress] });
    expect(screen.getByRole('progressbar').classList).toContain('ui-progress--warning');
    expect(bar().style.inlineSize).toBe('90%');
  });
});
