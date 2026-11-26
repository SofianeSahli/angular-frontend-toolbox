import { Route } from '@angular/router';
import { CatalogLayout } from './shell/catalog-layout/catalog-layout';

export const catalogRoutes: Route[] = [
  {
    path: '',
    component: CatalogLayout,
    children: [
      { path: '', title: 'Atomes', loadComponent: () => import('./pages/atoms/atoms-page/atoms.page').then((m) => m.AtomsPage) },
      { path: 'molecules', title: 'Molécules', loadComponent: () => import('./pages/molecules/molecules-page/molecules.page').then((m) => m.MoleculesPage) },
      { path: 'organisms', title: 'Organismes', loadComponent: () => import('./pages/organisms/organisms-page/organisms.page').then((m) => m.OrganismsPage) },
    ],
  },
  { path: 'templates/app-shell', title: 'App shell', loadComponent: () => import('./pages/templates/template-demos/template-demos').then((m) => m.AppShellDemo) },
  { path: 'templates/page', title: 'Page', loadComponent: () => import('./pages/templates/template-demos/template-demos').then((m) => m.PageDemo) },
  { path: 'templates/auth', title: 'Auth', loadComponent: () => import('./pages/templates/template-demos/template-demos').then((m) => m.AuthDemo) },
  { path: 'templates/flow', title: 'Parcours', loadComponent: () => import('./pages/templates/template-demos/template-demos').then((m) => m.FlowDemo) },
  { path: '**', redirectTo: '' },
];
