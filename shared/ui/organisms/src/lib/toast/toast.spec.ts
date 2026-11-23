import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { UiToastRegion } from './toast-region';
import { UiToast } from './toast.service';

function stubDevice(phone: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({ matches: phone, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  });
}

async function setup(phone = false) {
  stubDevice(phone);
  const result = await render(UiToastRegion);
  const toast = TestBed.inject(UiToast);
  const show = (...args: Parameters<UiToast['show']>) => {
    const handle = toast.show(...args);
    result.fixture.detectChanges();
    return handle;
  };
  return { show, toast, ...result };
}

describe('UiToast and ui-toast-region', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('shows a toast as a status, and a danger toast as an alert', async () => {
    const { show } = await setup();
    show({ message: 'Dépense ajoutée.', tone: 'success' });
    show({ message: 'Connexion perdue.', tone: 'danger' });
    expect(screen.getByRole('status').textContent).toContain('Dépense ajoutée.');
    expect(screen.getByRole('alert').textContent).toContain('Connexion perdue.');
  });

  it('closes on its own after its duration', async () => {
    const { show, fixture } = await setup();
    show({ message: 'Enregistré.', duration: 3000 });
    vi.advanceTimersByTime(2999);
    fixture.detectChanges();
    expect(screen.queryByText('Enregistré.')).toBeTruthy();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(screen.queryByText('Enregistré.')).toBeNull();
  });

  it('pauses while hovered and resumes with the remaining time', async () => {
    const { show, fixture } = await setup();
    show({ message: 'Enregistré.', duration: 3000 });
    vi.advanceTimersByTime(1000);
    const toast = screen.getByRole('status');
    fireEvent.mouseEnter(toast);
    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(screen.queryByText('Enregistré.')).toBeTruthy();
    fireEvent.mouseLeave(toast);
    await vi.advanceTimersByTimeAsync(1999);
    fixture.detectChanges();
    expect(screen.queryByText('Enregistré.')).toBeTruthy();
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(screen.queryByText('Enregistré.')).toBeNull();
  });

  it('runs its action once and closes', async () => {
    const run = vi.fn();
    const { show, fixture } = await setup();
    show({ message: 'Dépense supprimée.', action: { label: 'Annuler', run } });
    screen.getByRole('button', { name: 'Annuler' }).click();
    fixture.detectChanges();
    expect(run).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Dépense supprimée.')).toBeNull();
  });

  it('shows one toast at a time on phones', async () => {
    const phone = await setup(true);
    ['Un', 'Deux', 'Trois', 'Quatre'].forEach((message) => phone.show({ message }));
    expect(screen.getAllByRole('status').map((toast) => toast.textContent?.trim())).toEqual(['Quatre']);
  });

  it('shows up to three toasts on desktop', async () => {
    const desktop = await setup(false);
    ['Un', 'Deux', 'Trois', 'Quatre'].forEach((message) => desktop.show({ message }));
    expect(screen.getAllByRole('status').map((toast) => toast.textContent?.trim())).toEqual(['Deux', 'Trois', 'Quatre']);
  });
});
