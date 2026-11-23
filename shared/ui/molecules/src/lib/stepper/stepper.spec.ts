import { render, screen } from '@testing-library/angular';
import { UiStepper } from './stepper';

describe('ui-stepper', () => {
  it('says the step in words, and keeps the bars decorative', async () => {
    const { container } = await render('<ui-stepper [current]="1" [total]="2" />', { imports: [UiStepper] });
    expect(screen.getByText('Étape 1 sur 2')).toBeTruthy();
    const bars = container.querySelector('.ui-stepper__bars');
    expect(bars?.getAttribute('aria-hidden')).toBe('true');
    expect(Array.from(bars?.children ?? []).map((bar) => bar.classList.contains('ui-stepper__bar--done'))).toEqual([true, false]);
  });
});
