import { toBook, toInvitation, toNewBookBody, toReceivedInvitation } from './mappers';

describe('mappers', () => {
  it('maps a book from snake_case', () => {
    const book = toBook({
      id: 'b1',
      name: 'Foyer',
      currency: { code: 'TND', exponent: 3 },
      timezone: 'Africa/Tunis',
      owner: { type: 'household', id: 'h1' },
      can_manage: false,
    });
    expect(book).toEqual({
      id: 'b1',
      name: 'Foyer',
      currency: { code: 'TND', exponent: 3 },
      timezone: 'Africa/Tunis',
      owner: { type: 'household', id: 'h1' },
      canManage: false,
    });
  });

  it('parses invitation dates from ISO UTC', () => {
    const invitation = toInvitation({ id: 'i1', email: 'a@b.tn', created_at: '2026-11-21T09:30:00Z', expires_at: '2026-11-28T09:30:00Z' });
    expect(invitation.createdAt.toISOString()).toBe('2026-11-21T09:30:00.000Z');
    expect(invitation.expiresAt.toISOString()).toBe('2026-11-28T09:30:00.000Z');
  });

  it('maps a received invitation', () => {
    const received = toReceivedInvitation({
      id: 'i1',
      household: { id: 'h1', name: 'Foyer' },
      invited_by: { name: 'Sofiane' },
      created_at: '2026-11-21T09:30:00Z',
      expires_at: '2026-11-28T09:30:00Z',
    });
    expect(received.invitedBy.name).toBe('Sofiane');
    expect(received.household).toEqual({ id: 'h1', name: 'Foyer' });
    expect(received.expiresAt).toBeInstanceOf(Date);
  });

  it('builds a snake_case create-book body and omits unset fields', () => {
    expect(toNewBookBody({ name: 'Foyer', householdId: 'h1' })).toEqual({ name: 'Foyer', household_id: 'h1' });
    expect(toNewBookBody({ name: 'Perso', currency: 'EUR', timezone: 'Europe/Paris' })).toEqual({ name: 'Perso', currency: 'EUR', timezone: 'Europe/Paris' });
  });
});
