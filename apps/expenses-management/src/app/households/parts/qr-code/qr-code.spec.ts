import { render, screen } from '@testing-library/angular';
import { QrCode, qrPath } from './qr-code';

describe('QrCode (spec 009 REQ-11.3)', () => {
  it('draws the dark modules of the link inside a quiet zone', () => {
    const symbol = qrPath('https://exemple.tn/rejoindre#abc');
    expect(symbol.size).toBeGreaterThanOrEqual(25);
    expect(symbol.path).toMatch(/^M2 2h1v1h-1z/);
  });

  it('is a named image and dims when expired', async () => {
    const view = await render(QrCode, { inputs: { text: 'https://exemple.tn/rejoindre#abc', label: "QR code d'invitation", expired: true } });
    expect(screen.getByRole('img', { name: "QR code d'invitation" })).toBeTruthy();
    expect((view.fixture.nativeElement as HTMLElement).classList).toContain('qr-code--expired');
  });
});
