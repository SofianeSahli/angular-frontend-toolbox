export type Role = 'owner' | 'member';

export interface Household {
  readonly id: string;
  readonly name: string;
  readonly role: Role;
}

export interface Member {
  readonly id: string;
  readonly name: string;
  readonly role: Role;
}

export interface Currency {
  readonly code: string;
  readonly exponent: number;
}

export interface BookOwner {
  readonly type: 'account' | 'household';
  readonly id: string;
}

export interface Book {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
  readonly timezone: string;
  readonly owner: BookOwner;
  readonly canManage: boolean;
}

export interface Invitation {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface ReceivedInvitation {
  readonly id: string;
  readonly household: { readonly id: string; readonly name: string };
  readonly invitedBy: { readonly name: string };
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface NewBook {
  readonly name: string;
  readonly currency?: string;
  readonly timezone?: string;
  readonly householdId?: string;
}

export type HouseholdDto = Household;
export type MemberDto = Member;

export interface BookDto {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
  readonly timezone: string;
  readonly owner: BookOwner;
  readonly can_manage: boolean;
}

export interface InvitationDto {
  readonly id: string;
  readonly email: string;
  readonly created_at: string;
  readonly expires_at: string;
}

export interface ReceivedInvitationDto {
  readonly id: string;
  readonly household: { readonly id: string; readonly name: string };
  readonly invited_by: { readonly name: string };
  readonly created_at: string;
  readonly expires_at: string;
}
