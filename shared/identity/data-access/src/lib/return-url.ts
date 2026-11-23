const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function safeReturnUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null;
  const isInternalPath = value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') && !SCHEME.test(value);
  return isInternalPath ? value : null;
}
