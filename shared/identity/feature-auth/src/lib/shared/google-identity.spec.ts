import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { GOOGLE_IDENTITY_SCRIPT, GoogleAccountsId, GoogleIdentityLoader } from './google-identity';

type GoogleGlobal = Window & { google?: { accounts: { id: GoogleAccountsId } } };

function scripts(): HTMLScriptElement[] {
  return Array.from(TestBed.inject(DOCUMENT).head.querySelectorAll<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`));
}

describe('GoogleIdentityLoader', () => {
  afterEach(() => {
    scripts().forEach((script) => script.remove());
    delete (window as GoogleGlobal).google;
  });

  it('adds the Google script once and resolves with google.accounts.id', async () => {
    const loader = TestBed.inject(GoogleIdentityLoader);
    const first = loader.load();
    const second = loader.load();
    expect(scripts()).toHaveLength(1);

    const accountsId: GoogleAccountsId = { initialize: vi.fn(), renderButton: vi.fn() };
    (window as GoogleGlobal).google = { accounts: { id: accountsId } };
    scripts()[0].dispatchEvent(new Event('load'));

    expect(await first).toBe(accountsId);
    expect(await second).toBe(accountsId);
  });

  it('rejects when the script fails, and tries again on the next call', async () => {
    const loader = TestBed.inject(GoogleIdentityLoader);
    const failing = loader.load();
    scripts()[0].dispatchEvent(new Event('error'));
    await expect(failing).rejects.toThrow();
    expect(scripts()).toHaveLength(0);

    void loader.load().catch(() => undefined);
    expect(scripts()).toHaveLength(1);
  });
});
