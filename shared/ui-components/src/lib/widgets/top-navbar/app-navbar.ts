import { CommonModule } from '@angular/common';
import { Component, inject, input, model, output } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ThemeService } from '../../utils/display-mode.service';
import { DrawerHeader } from '../drawer-header/drawer-header';

@Component({
  selector: 'lib-app-navbar-top',
  imports: [RouterLink, RouterModule, CommonModule, DrawerHeader],
  templateUrl: './app-navbar.html',
  styleUrl: './app-navbar.scss',
})
export class AppNavbar {
  user = input.required();

  isCollapsed = model(false);
  routes = input.required<
    Array<{
      label: string;
      url: string;
      icon: string;
    }>
  >();
  themeService = inject(ThemeService);
  router = inject(Router);
  isDarkMode: boolean = this.themeService.isLight();
  logOutClicked = output<void>();
  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode;
  }

  isActive(url: string): boolean {
    const currentUrl = this.router.url;

    // Dashboard requires exact match
    if (url === '/dashboard') {
      return currentUrl === '/dashboard' || currentUrl === '/dashboard/';
    }

    // Other routes use prefix matching
    return currentUrl.startsWith(url);
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
