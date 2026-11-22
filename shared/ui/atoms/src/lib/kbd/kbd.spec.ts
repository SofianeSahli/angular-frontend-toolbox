import { render } from '@testing-library/angular';
import { UiKbd } from './kbd';

describe('uiKbd', () => {
  it('shows the shortcut, with an on-accent style inside a primary button', async () => {
    const { container } = await render('<kbd uiKbd>N</kbd><kbd uiKbd onAccent>/</kbd>', { imports: [UiKbd] });
    const [plain, onAccent] = Array.from(container.querySelectorAll('kbd'));
    expect(plain.textContent).toBe('N');
    expect(plain.classList).not.toContain('ui-kbd--on-accent');
    expect(onAccent.classList).toContain('ui-kbd--on-accent');
  });
});
