import { Route } from '@angular/router';
import { List } from '../money-transactions/list/list';
import { Summary } from '../money-transactions/summary/summary';
import { Parameters } from '../profile/parameters';
import { Dashboard } from './dashboard';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    component: Dashboard,
    children: [
      {
        path: '',
        component: Summary,
      },
      {
        path: 'lists',
        component: List,
      }, {
        path: 'settings',
        component: Parameters
      }
    ],
  },
];
