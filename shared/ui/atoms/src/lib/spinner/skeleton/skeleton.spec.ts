import { render } from '@testing-library/angular';
import { UiSkeleton } from './skeleton';

describe('ui-skeleton', () => {
  it.each(['line', 'block', 'circle'])('draws the %s shape, hidden from assistive technology', async (shape) => {
    const { container } = await render(`<ui-skeleton shape="${shape}" />`, { imports: [UiSkeleton] });
    const skeleton = container.querySelector('ui-skeleton');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton?.classList).toContain(`ui-skeleton--${shape}`);
  });
});
