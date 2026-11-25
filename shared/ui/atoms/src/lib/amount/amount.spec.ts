import { render } from '@testing-library/angular';
import { UiAmount } from './amount';

const SPACES = new RegExp(`[${String.fromCharCode(0x202f, 0x00a0)}]`, 'g');

async function shownText(template: string): Promise<{ text: string; host: Element | null }> {
  const { container } = await render(template, { imports: [UiAmount] });
  const host = container.querySelector('ui-amount');
  return { text: (host?.textContent ?? '').replace(SPACES, ' ').replace(/\s+/g, ' ').trim(), host };
}

describe('ui-amount', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['[millimes]="48350"', '48,350 DT'],
    ['[millimes]="1843000" display="rounded"', '1 843 DT'],
    ['[millimes]="2800000" tone="income"', '+2 800,000 DT'],
    ['[millimes]="2800400" tone="income" display="rounded"', '+2 800 DT'],
  ])('%s shows %s', async (inputs, expected) => {
    expect((await shownText(`<ui-amount ${inputs} />`)).text).toBe(expected);
  });

  it('formats in the given currency (spec 007 REQ-1.4)', async () => {
    const { text } = await shownText(`<ui-amount [millimes]="1250" [currency]="{ code: 'EUR', exponent: 2 }" />`);
    expect(text).toMatch(/^12,50 /);
    expect(text).not.toContain('DT');
  });

  it('shows no decimals for JPY', async () => {
    expect((await shownText(`<ui-amount [millimes]="1500" [currency]="{ code: 'JPY', exponent: 0 }" />`)).text).toMatch(/^1 500 /);
  });

  it('keeps spending neutral', async () => {
    expect((await shownText('<ui-amount [millimes]="500" />')).host?.classList).not.toContain('ui-amount--income');
  });

  it('gives income the success style', async () => {
    expect((await shownText('<ui-amount [millimes]="500" tone="income" />')).host?.classList).toContain('ui-amount--income');
  });

  it('sets the unit apart in the hero size', async () => {
    const { host } = await shownText('<ui-amount [millimes]="1843000" display="rounded" size="hero" />');
    expect(host?.classList).toContain('ui-amount--hero');
    expect(host?.querySelector('.ui-amount__unit')?.textContent).toBe('DT');
  });

  it('shows nothing and reports a non-integer amount instead of throwing', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect((await shownText('<ui-amount [millimes]="1.5" />')).text).toBe('');
    expect(report).toHaveBeenCalledWith('ui-amount:', expect.any(RangeError));
  });
});
