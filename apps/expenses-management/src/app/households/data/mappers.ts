import { Book, BookDto, Household, HouseholdDto, Invitation, InvitationDto, Member, MemberDto, NewBook, ReceivedInvitation, ReceivedInvitationDto } from './models';

export function toHousehold(dto: HouseholdDto): Household {
  return { id: dto.id, name: dto.name, role: dto.role };
}

export function toMember(dto: MemberDto): Member {
  return { id: dto.id, name: dto.name, role: dto.role };
}

export function toBook(dto: BookDto): Book {
  return {
    id: dto.id,
    name: dto.name,
    currency: { code: dto.currency.code, exponent: dto.currency.exponent },
    timezone: dto.timezone,
    owner: { type: dto.owner.type, id: dto.owner.id },
    canManage: dto.can_manage,
  };
}

export function toInvitation(dto: InvitationDto): Invitation {
  return { id: dto.id, email: dto.email, createdAt: new Date(dto.created_at), expiresAt: new Date(dto.expires_at) };
}

export function toReceivedInvitation(dto: ReceivedInvitationDto): ReceivedInvitation {
  return {
    id: dto.id,
    household: { id: dto.household.id, name: dto.household.name },
    invitedBy: { name: dto.invited_by.name },
    createdAt: new Date(dto.created_at),
    expiresAt: new Date(dto.expires_at),
  };
}

export function toNewBookBody(input: NewBook): Record<string, string> {
  const body: Record<string, string> = { name: input.name };
  if (input.currency !== undefined) body['currency'] = input.currency;
  if (input.timezone !== undefined) body['timezone'] = input.timezone;
  if (input.householdId !== undefined) body['household_id'] = input.householdId;
  return body;
}
