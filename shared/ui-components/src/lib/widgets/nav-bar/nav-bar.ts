import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbCollapseModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../utils/display-mode.service';


@Component({
  selector: 'app-nav-bar',
  imports: [RouterModule, CommonModule, TranslateModule, NgbCollapseModule],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
  animations: [
    trigger('slideInOut', [
      state('out', style({ width: '0px', padding: '0' })),
      state('in', style({ width: '100%', padding: '0.5rem' })),

      transition('in <=> out', [animate('300ms ease-out')]),
    ]),
  ],
})
export class NavBar {
  ROUTES = signal<Array<any>>([]);
  modalService = inject(NgbModal);
  themeService = inject(ThemeService);
  isCollapsedSearchCollapsed = true;
  isCollapsed = false;
  isNotificationOpen = false;
  unreadCount = 0;
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  isDarkMode: boolean = this.themeService.isLight();

  toggleNotifications() {
    this.isNotificationOpen = !this.isNotificationOpen;
    if (this.isNotificationOpen) this.unreadCount = 0;
  }

  getNotif(notif: Notification) {
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  logout() {
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }


}
