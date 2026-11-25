import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@shared/http-data-access';
import fr from '../../../../public/i18n/fr.json';
import { FakeStores, book, failed, fakeStores, invitation, member, renderPage, sentInvitation, settle } from '../testing';
import { HouseholdPage } from './household.page';

const t = fr.households.household;
const owner = { id: 'h1', name: 'Les Martin', role: 'owner' as const };
const memberOf = { id: 'h1', name: 'Les Martin', role: 'member' as const };

describe('HouseholdPage', () => {
  let stores: FakeStores;

  beforeEach(() => {
    stores = fakeStores();
  });

  const open = () => renderPage(HouseholdPage, stores, '/foyer');
  const button = (name: string) => screen.getByRole('button', { name: new RegExp(name) });

  describe('without a household', () => {
    it('shows the empty state with "Créer un foyer" and the received invitations', async () => {
      stores.invitations.received.set([invitation('i1')]);
      await open();
      expect(screen.getByText(t.empty.title)).toBeTruthy();
      expect(screen.getByRole('link', { name: t.empty.create }).getAttribute('href')).toBe('/foyer/nouveau');
      expect(screen.getByRole('article', { name: 'Les Martin' })).toBeTruthy();
      expect(stores.invitations.load).toHaveBeenCalled();
      expect(stores.household.loadDetail).not.toHaveBeenCalled();
    });

    it('accepts an invitation and loads the new household detail', async () => {
      stores.invitations.received.set([invitation('i1')]);
      stores.invitations.accept.mockImplementation(async () => {
        stores.household.household.set(memberOf);
        return { outcome: 'done' };
      });
      await open();
      await userEvent.click(screen.getByRole('button', { name: fr.households.invitation.accept }));
      await settle();
      expect(stores.invitations.accept).toHaveBeenCalledWith('i1');
      expect(stores.household.loadDetail).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: t.leave })).toBeTruthy();
    });

    it('shows the message of a failed answer', async () => {
      stores.invitations.received.set([invitation('i1')]);
      stores.invitations.decline.mockResolvedValue(failed('invitation.not_found', 404));
      await open();
      await userEvent.click(screen.getByRole('button', { name: fr.households.invitation.decline }));
      await settle();
      expect(screen.getByText(fr.households.errors.invitation.not_found)).toBeTruthy();
    });
  });

  describe('as the owner', () => {
    beforeEach(() => {
      stores.household.household.set(owner);
      stores.household.members.set([member('u1', 'owner'), member('u2')]);
    });

    it('shows the name, the owner badge, the actions and the members', async () => {
      await open();
      expect(screen.getByText('Les Martin').tagName).toBe('BDI');
      expect(screen.getAllByText(t.owner).length).toBeGreaterThan(0);
      expect(button(t.rename)).toBeTruthy();
      expect(button(t.delete)).toBeTruthy();
      expect(screen.queryByRole('button', { name: t.leave })).toBeNull();
      expect(screen.getAllByRole('button', { name: new RegExp(t.remove) })).toHaveLength(1);
      expect(stores.household.loadDetail).toHaveBeenCalled();
    });

    it('links to the household book creation only when the household has no book', async () => {
      await open();
      expect(screen.getByRole('link', { name: t.createBook }).getAttribute('href')).toBe('/carnets/nouveau?foyer=1');
    });

    it('hides the book creation link when the household book exists', async () => {
      stores.books.books.set([book('h', 'household')]);
      await open();
      expect(screen.queryByRole('link', { name: t.createBook })).toBeNull();
    });

    it('shows skeletons while the detail loads', async () => {
      stores.household.loading.set(true);
      const view = await open();
      expect(view.container.querySelectorAll('ui-skeleton').length).toBeGreaterThan(0);
      expect(screen.queryByRole('list')).toBeNull();
    });

    describe('rename', () => {
      const rename = async (name = 'Les Ben Ali') => {
        await userEvent.click(button(t.rename));
        const field = screen.getByRole('textbox', { name: new RegExp(t.name) });
        await userEvent.clear(field);
        await userEvent.type(field, name);
        await userEvent.click(screen.getByRole('button', { name: t.renameSave }));
        await settle();
      };

      it('renames and shows a toast', async () => {
        const view = await open();
        await rename();
        expect(stores.household.rename).toHaveBeenCalledWith('Les Ben Ali');
        expect(view.toasts().map((toast) => toast.message)).toContain(t.renamed);
        expect(screen.queryByRole('button', { name: t.renameSave })).toBeNull();
      });

      it('puts a 422 field code on the field', async () => {
        stores.household.rename.mockResolvedValue({
          outcome: 'error',
          error: new ApiError('validation', 422, 'validation.failed', { name: ['name.max'] }, null, 'r'),
        });
        await open();
        await rename();
        expect(screen.getByText(fr.households.fields.name.max)).toBeTruthy();
      });

      it('shows the forbidden message when the role changed', async () => {
        stores.household.rename.mockResolvedValue(failed('household.forbidden', 403));
        await open();
        await rename();
        expect(screen.getByText(fr.households.errors.household.forbidden)).toBeTruthy();
      });

      it('leaves the household when it no longer exists', async () => {
        stores.household.rename.mockResolvedValue(failed('household.not_found', 404));
        const view = await open();
        await rename();
        expect(stores.books.load).toHaveBeenCalledWith({ force: true });
        expect(view.toasts().map((toast) => toast.message)).toContain(t.gone);
        expect(view.router.url).toBe('/bienvenue');
      });
    });

    describe('delete', () => {
      it('asks first and does nothing when declined', async () => {
        stores.confirm.ask.mockResolvedValue(false);
        await open();
        await userEvent.click(button(t.delete));
        await settle();
        expect(stores.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: t.deleteConfirm.title, tone: 'danger' }));
        expect(stores.household.deleteHousehold).not.toHaveBeenCalled();
      });

      it('deletes and goes home when a book remains', async () => {
        stores.books.books.set([book('a')]);
        const view = await open();
        await userEvent.click(button(t.delete));
        await settle();
        expect(stores.household.deleteHousehold).toHaveBeenCalled();
        expect(view.router.url).toBe('/');
      });

      it('deletes and goes to the welcome page when no book remains', async () => {
        const view = await open();
        await userEvent.click(button(t.delete));
        await settle();
        expect(view.router.url).toBe('/bienvenue');
      });

      it('reloads the household on 403', async () => {
        stores.household.deleteHousehold.mockResolvedValue(failed('household.forbidden', 403));
        const view = await open();
        await userEvent.click(button(t.delete));
        await settle();
        expect(stores.household.loadHousehold).toHaveBeenCalled();
        expect(screen.getByText(fr.households.errors.household.forbidden)).toBeTruthy();
        expect(view.router.url).toBe('/foyer');
      });
    });

    describe('remove member', () => {
      it('asks, removes and shows a toast', async () => {
        const view = await open();
        await userEvent.click(button(t.remove));
        await settle();
        expect(stores.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: t.removeConfirm.title, tone: 'danger' }));
        expect(stores.household.removeMember).toHaveBeenCalledWith('u2');
        expect(view.toasts().map((toast) => toast.message)).toContain(t.removed);
      });

      it('does nothing when declined', async () => {
        stores.confirm.ask.mockResolvedValue(false);
        await open();
        await userEvent.click(button(t.remove));
        await settle();
        expect(stores.household.removeMember).not.toHaveBeenCalled();
      });

      it('leaves the household on 404 household.not_found', async () => {
        stores.household.removeMember.mockResolvedValue(failed('household.not_found', 404));
        const view = await open();
        await userEvent.click(button(t.remove));
        await settle();
        expect(view.router.url).toBe('/bienvenue');
      });
    });
  });

  describe('as a member', () => {
    beforeEach(() => {
      stores.household.household.set(memberOf);
      stores.household.members.set([member('u0', 'owner'), member('u1')]);
    });

    it('shows the members read-only and no owner control', async () => {
      await open();
      expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
      expect(screen.queryByRole('button', { name: new RegExp(t.rename) })).toBeNull();
      expect(screen.queryByRole('button', { name: new RegExp(t.delete) })).toBeNull();
      expect(screen.queryByRole('button', { name: new RegExp(t.remove) })).toBeNull();
      expect(screen.queryByRole('link', { name: t.createBook })).toBeNull();
      expect(button(t.leave)).toBeTruthy();
    });

    it('asks, leaves and goes home when a book remains', async () => {
      stores.books.books.set([book('a')]);
      const view = await open();
      await userEvent.click(button(t.leave));
      await settle();
      expect(stores.confirm.ask).toHaveBeenCalledWith(expect.objectContaining({ title: t.leaveConfirm.title }));
      expect(stores.household.leave).toHaveBeenCalled();
      expect(view.router.url).toBe('/');
    });

    it('does not leave when declined', async () => {
      stores.confirm.ask.mockResolvedValue(false);
      await open();
      await userEvent.click(button(t.leave));
      await settle();
      expect(stores.household.leave).not.toHaveBeenCalled();
    });

    it('shows the owner view with a message when the role changed to owner', async () => {
      stores.household.leave.mockImplementation(async () => {
        stores.household.household.set(owner);
        return failed('household.owner_cannot_leave');
      });
      const view = await open();
      await userEvent.click(button(t.leave));
      await settle();
      expect(screen.getByText(fr.households.errors.household.owner_cannot_leave)).toBeTruthy();
      expect(button(t.delete)).toBeTruthy();
      expect(view.router.url).toBe('/foyer');
    });
  });

  describe('invitations of the owner', () => {
    beforeEach(() => {
      stores.household.household.set(owner);
      stores.household.members.set([member('u1', 'owner')]);
    });

    const invite = async (email = 'sami@exemple.tn') => {
      await userEvent.type(screen.getByRole('textbox', { name: new RegExp(t.invite.email) }), email);
      await userEvent.click(screen.getByRole('button', { name: t.invite.submit }));
      await settle();
    };

    it('lists the pending invitations, or the empty text', async () => {
      await open();
      expect(screen.getByText(t.noInvitations)).toBeTruthy();
    });

    it('shows the pending invitations', async () => {
      stores.household.sent.set([sentInvitation('i1', 'a@exemple.tn')]);
      await open();
      expect(screen.getByText('a@exemple.tn')).toBeTruthy();
    });

    it('cancels an invitation', async () => {
      stores.household.sent.set([sentInvitation('i1')]);
      await open();
      await userEvent.click(button(t.cancelInvitation));
      await settle();
      expect(stores.household.cancelInvitation).toHaveBeenCalledWith('i1');
    });

    it('leaves the household when cancelling answers household.not_found', async () => {
      stores.household.sent.set([sentInvitation('i1')]);
      stores.household.cancelInvitation.mockResolvedValue(failed('household.not_found', 404));
      const view = await open();
      await userEvent.click(button(t.cancelInvitation));
      await settle();
      expect(view.router.url).toBe('/bienvenue');
    });

    it('invites, clears the field and says a notice was sent', async () => {
      const view = await open();
      await invite();
      expect(stores.household.invite).toHaveBeenCalledWith('sami@exemple.tn');
      expect((screen.getByRole('textbox', { name: new RegExp(t.invite.email) }) as HTMLInputElement).value).toBe('');
      expect(view.toasts().map((toast) => toast.message)).toContain(t.invite.sent);
    });

    it.each([
      ['invitation.self', fr.households.errors.invitation.self],
      ['invitation.already_member', fr.households.errors.invitation.already_member],
      ['invitation.already_pending', fr.households.errors.invitation.already_pending],
      ['household.member_limit', fr.households.errors.household.member_limit],
      ['invitation.limit_reached', fr.households.errors.invitation.limit_reached],
    ])('shows the message of %s on the email field', async (code, text) => {
      stores.household.invite.mockResolvedValue(failed(code));
      await open();
      await invite();
      expect(screen.getByText(text)).toBeTruthy();
    });

    it.each([
      ['email.required', fr.households.fields.email.required],
      ['email.string', fr.households.fields.email.string],
      ['email.email', fr.households.fields.email.email],
      ['email.max', fr.households.fields.email.max],
    ])('shows the field code %s on the email field', async (code, text) => {
      stores.household.invite.mockResolvedValue({
        outcome: 'error',
        error: new ApiError('validation', 422, 'validation.failed', { email: [code] }, null, 'r'),
      });
      await open();
      await invite();
      expect(screen.getByText(text)).toBeTruthy();
    });

    it('shows the invitation throttle text with the delay in hours', async () => {
      stores.household.invite.mockResolvedValue(failed('request.throttled', 429, 'throttled', 7200));
      await open();
      await invite();
      expect(screen.getByText(/2 h/).textContent).toContain(t.invite.throttled.split('{{')[0].trim());
    });

    it('never shows invitation controls to a member', async () => {
      stores.household.household.set(memberOf);
      await open();
      expect(screen.queryByRole('textbox', { name: new RegExp(t.invite.email) })).toBeNull();
      expect(screen.queryByText(t.noInvitations)).toBeNull();
    });
  });
});
