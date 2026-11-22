import { render, screen } from '@testing-library/angular';
import { provideIcons } from './icon-registry';
import { UiIcon } from './icon';

const square = { nodes: [['rect', { x: '2', y: '2', width: '20', height: '20', rx: '2' }]] } as const;

describe('ui-icon', () => {
  afterEach(() => vi.restoreAllMocks());

  it('draws a registered icon, hidden from assistive technology by default', async () => {
    const { container } = await render('<ui-icon name="search" />', { imports: [UiIcon] });
    const host = container.querySelector('ui-icon');
    expect(host?.getAttribute('aria-hidden')).toBe('true');
    expect(host?.querySelectorAll('svg path, svg circle').length).toBeGreaterThan(0);
  });

  it('takes a role and a name when it has a label', async () => {
    await render('<ui-icon name="search" label="Rechercher" />', { imports: [UiIcon] });
    expect(screen.getByRole('img', { name: 'Rechercher' })).toBeTruthy();
  });

  it.each([
    [16, 'ui-icon--16'],
    [24, 'ui-icon--24'],
  ])('applies size %d', async (size, cssClass) => {
    const { container } = await render(`<ui-icon name="plus" [size]="${size}" />`, { imports: [UiIcon] });
    expect(container.querySelector('ui-icon')?.classList).toContain(cssClass);
  });

  it('draws a tile when asked', async () => {
    const { container } = await render('<ui-icon name="car" tile />', { imports: [UiIcon] });
    expect(container.querySelector('ui-icon')?.classList).toContain('ui-icon--tile');
  });

  it('marks directional icons so they mirror in RTL, and only those', async () => {
    const { container } = await render('<ui-icon name="repeat" /><ui-icon name="arrow-up" />', { imports: [UiIcon] });
    const [repeat, arrowUp] = Array.from(container.querySelectorAll('ui-icon'));
    expect(repeat.classList).toContain('ui-icon--directional');
    expect(arrowUp.classList).not.toContain('ui-icon--directional');
  });

  it('uses icons an app registers, with the app winning over the starter set', async () => {
    const { container } = await render('<ui-icon name="square" /><ui-icon name="plus" />', {
      imports: [UiIcon],
      providers: [provideIcons({ square, plus: square })],
    });
    expect(container.querySelectorAll('svg rect')).toHaveLength(2);
  });

  it('renders nothing and reports an unknown name', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { container } = await render('<ui-icon name="nope" />', { imports: [UiIcon] });
    expect(container.querySelector('svg')).toBeNull();
    expect(report).toHaveBeenCalledWith('ui-icon: no icon is registered under "nope"');
  });
});

describe('ui-icon starter set additions', () => {
  const added = ['info', 'circle-check', 'triangle-exclamation-point', 'circle-x', 'x', 'eye', 'eye-off', 'ellipsis', 'inbox', 'pencil', 'check', 'menu'];
  const directional = ['chevron-left', 'chevron-right', 'arrow-left'];

  it.each(added)('draws %s, which does not mirror', async (name) => {
    const { container } = await render(`<ui-icon name="${name}" />`, { imports: [UiIcon] });
    const host = container.querySelector('ui-icon');
    expect(host?.querySelector('svg')?.children.length).toBeGreaterThan(0);
    expect(host?.classList).not.toContain('ui-icon--directional');
  });

  it.each(directional)('draws %s and mirrors it in RTL', async (name) => {
    const { container } = await render(`<ui-icon name="${name}" />`, { imports: [UiIcon] });
    expect(container.querySelector('ui-icon')?.classList).toContain('ui-icon--directional');
  });
});
