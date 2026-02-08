import { Component, inject, model } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { authStore } from '@shared/auth';
import { AppNavbar } from '@shared/ui-components';
import { categoriesStore } from '../../stores/categories.signal';
import { ProfileFormComponent } from '../profile/profile-form/profile-form.component';

@Component({
  selector: 'app-dashboard',
  imports: [ProfileFormComponent, AppNavbar, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  authSignal = inject(authStore);
  drawerCollapsed = model(true)
  categoriesStore = inject(categoriesStore);
  routingsLists = [
    {
      label: 'routings.settings',
      url: '/dashboard/settings',
      icon: "bi bi-gear  fs-6"

    },
    {
      label: 'routings.summary',
      url: '/dashboard',
      icon: 'bi bi-bar-chart  fs-6'
    },
    {
      label: 'routings.listes',
      url: '/dashboard/lists',
      icon: 'bi bi-list-ul  fs-6'
    }
  ];
}
