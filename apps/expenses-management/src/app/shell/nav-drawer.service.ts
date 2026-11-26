import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UiDrawer } from '@shared/ui-organisms';
import { NavDrawer, NavDrawerData, NavDrawerFocus, NavDrawerResult } from './nav-drawer';

@Injectable({ providedIn: 'root' })
export class NavDrawerService {
  private readonly drawer = inject(UiDrawer);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  open(focus: NavDrawerFocus = null): void {
    this.drawer
      .open<NavDrawerResult, NavDrawerData>(NavDrawer, { title: this.translate.instant('shell.menu'), data: { focus } })
      .closed.subscribe((result) => {
        if (result?.navigate) void this.router.navigateByUrl(result.navigate);
      });
  }
}
