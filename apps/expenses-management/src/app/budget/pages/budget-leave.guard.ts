import { CanDeactivateFn } from '@angular/router';

export interface LeaveCheck {
  canLeave(): Promise<boolean> | boolean;
}

export const budgetLeaveGuard: CanDeactivateFn<LeaveCheck> = (page) => page.canLeave();
