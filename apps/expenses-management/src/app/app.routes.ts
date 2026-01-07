import { Route } from '@angular/router';
import { authRoutes } from '@shared/auth';

export const appRoutes: Route[] = [

  {
    path: '',
    children: authRoutes,
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dahsboard.routes').then((m) => m.dashboardRoutes),
  },
];
