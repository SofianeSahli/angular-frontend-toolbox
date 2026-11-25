import { render, screen } from '@testing-library/angular';
import { UiMeter } from './meter';

function fill(): HTMLElement {
  return screen.getByRole('meter').querySelector('.ui-meter__fill') as HTMLElement;
}

describe('ui-meter (spec 008 REQ-7.1)', () => {
  it('is a named meter with its values and value text', async () => {
    await render('<ui-meter [value]="540000" [max]="600000" label="Alimentation" valueText="90 %" />', { imports: [UiMeter] });
    const meter = screen.getByRole('meter', { name: 'Alimentation' });
    expect(meter.getAttribute('aria-valuenow')).toBe('540000');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('600000');
    expect(meter.getAttribute('aria-valuetext')).toBe('90 %');
    expect(fill().style.inlineSize).toBe('90%');
  });

  it('has no value text when none is given', async () => {
    await render('<ui-meter [value]="1" [max]="2" label="Transport" />', { imports: [UiMeter] });
    expect(screen.getByRole('meter').hasAttribute('aria-valuetext')).toBe(false);
  });

  it('caps the fill at 100 % and still reports the real value', async () => {
    await render('<ui-meter [value]="160000" [max]="100000" label="Transport" state="over" />', { imports: [UiMeter] });
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('160000');
    expect(fill().style.inlineSize).toBe('100%');
  });

  it('shows an empty track when max is 0', async () => {
    await render('<ui-meter [value]="100000" [max]="0" label="Sorties" state="over" />', { imports: [UiMeter] });
    expect(fill().style.inlineSize).toBe('0%');
  });

  it('marks over with the stripes class and an icon', async () => {
    await render('<ui-meter [value]="3" [max]="2" label="Sorties" state="over" />', { imports: [UiMeter] });
    const meter = screen.getByRole('meter');
    expect(meter.classList).toContain('ui-meter--over');
    expect(meter.querySelector('ui-icon')).not.toBeNull();
  });

  it('marks warning with an icon', async () => {
    await render(UiMeter, { inputs: { value: 9, max: 10, label: 'Maison', state: 'warning' } });
    expect(screen.getByRole('meter').classList).toContain('ui-meter--warning');
    expect(screen.getByRole('meter').querySelector('ui-icon')).not.toBeNull();
  });

  it('shows no icon when ok', async () => {
    await render(UiMeter, { inputs: { value: 1, max: 10, label: 'Maison' } });
    expect(screen.getByRole('meter').classList).not.toContain('ui-meter--over');
    expect(screen.getByRole('meter').querySelector('ui-icon')).toBeNull();
  });

  it('grows the fill from the inline-start edge, so RTL mirrors it', async () => {
    await render('<div dir="rtl"><ui-meter [value]="1" [max]="4" label="Santé" /></div>', { imports: [UiMeter] });
    expect(fill().classList).toContain('ui-meter__fill');
    expect(fill().style.inlineSize).toBe('25%');
    expect(fill().style.left).toBe('');
  });
});
