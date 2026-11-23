export type AccountLocale = 'fr' | 'en';

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly locale: AccountLocale;
  readonly twoFactorEnabled: boolean;
}

export type Session =
  | { readonly status: 'signed_in'; readonly account: Account }
  | { readonly status: 'code_required'; readonly pendingSignIn: string; readonly expiresInSeconds: number };

export interface AccountDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly locale: AccountLocale;
  readonly two_factor_enabled: boolean;
}

export type SessionDto =
  | { readonly status: 'signed_in'; readonly account: AccountDto }
  | { readonly status: 'code_required'; readonly pending_sign_in: string; readonly expires_in_seconds: number };

export interface DataEnvelope<T> {
  readonly data: T;
}

export interface RegisterRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
  readonly locale: AccountLocale;
}

export interface GoogleSignInRequest {
  readonly idToken: string;
  readonly termsVersion?: string;
  readonly locale: AccountLocale;
}

export function toAccount(dto: AccountDto): Account {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    locale: dto.locale,
    twoFactorEnabled: dto.two_factor_enabled,
  };
}

export function toSession(dto: SessionDto): Session {
  return dto.status === 'signed_in'
    ? { status: 'signed_in', account: toAccount(dto.account) }
    : { status: 'code_required', pendingSignIn: dto.pending_sign_in, expiresInSeconds: dto.expires_in_seconds };
}
