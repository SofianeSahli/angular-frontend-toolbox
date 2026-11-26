import { inject } from '@angular/core';
import { CanActivateFn, Route, Router } from '@angular/router';
import { SHELL_BOOK_BOUND, SHELL_TITLE_KEY, SignedInShell } from './shell';
import { authGuard, guestGuard } from '@shared/identity-data-access';
import { AuthFrame } from './auth-frame/auth-frame/auth-frame';
import { BooksStore } from './households/data/books.store';
import { firstRunGuard, householdBookGuard, workspaceGuard } from './households/data/guards';
import { HouseholdStore } from './households/data/household.store';
import { budgetLeaveGuard } from './budget/pages/budget-leave.guard';

export const PATHS = {
  signIn: '/connexion',
  signUp: '/inscription',
  emailCode: '/inscription/code',
  twoFactor: '/connexion/code',
  forgotPassword: '/mot-de-passe-oublie',
  resetPassword: '/mot-de-passe/nouveau',
  unavailable: '/indisponible',
  terms: '/conditions',
  privacy: '/confidentialite',
  welcome: '/bienvenue',
  household: '/foyer',
  newHousehold: '/foyer/nouveau',
  newBook: '/carnets/nouveau',
  operations: '/operations',
  recurring: '/recurrentes',
  analysis: '/analyse',
  join: '/rejoindre',
  budget: '/budget',
} as const;

const identityPages = () => import('@shared/identity-feature-auth');
const routePath = (path: string) => path.slice(1);

const noHouseholdGuard: CanActivateFn = async () => {
  const books = inject(BooksStore);
  const household = inject(HouseholdStore);
  const router = inject(Router);
  await books.load();
  return household.household() === null || router.parseUrl(PATHS.household);
};

export const appRoutes: Route[] = [
  {
    path: routePath(PATHS.welcome),
    canActivate: [authGuard, firstRunGuard],
    loadComponent: () => import('./households/pages/welcome-page/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: routePath(PATHS.newHousehold),
    canActivate: [authGuard, noHouseholdGuard],
    loadComponent: () => import('./households/pages/household-new-page/household-new.page').then((m) => m.HouseholdNewPage),
  },
  {
    path: routePath(PATHS.newBook),
    canActivate: [authGuard, householdBookGuard],
    loadComponent: () => import('./households/pages/book-new-page/book-new.page').then((m) => m.BookNewPage),
  },
  {
    path: '',
    component: SignedInShell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [workspaceGuard],
        loadComponent: () => import('./dashboard/pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
        data: { [SHELL_TITLE_KEY]: 'home.title', [SHELL_BOOK_BOUND]: true },
      },
      {
        path: routePath(PATHS.budget),
        canActivate: [workspaceGuard],
        canDeactivate: [budgetLeaveGuard],
        loadComponent: () => import('./budget/pages/budget-page/budget-page').then((m) => m.BudgetPage),
        data: { [SHELL_TITLE_KEY]: 'budget.title', [SHELL_BOOK_BOUND]: true },
      },
      { path: 'operations/recurrentes', redirectTo: ({ queryParams }) => inject(Router).createUrlTree([PATHS.recurring], { queryParams }) },
      {
        path: routePath(PATHS.analysis),
        canActivate: [workspaceGuard],
        loadComponent: () => import('./analysis/pages/analysis-page/analysis-page').then((m) => m.AnalysisPage),
        data: { [SHELL_TITLE_KEY]: 'analysis.title', [SHELL_BOOK_BOUND]: true },
      },
      {
        path: routePath(PATHS.join),
        loadComponent: () => import('./households/pages/join-page/join.page').then((m) => m.JoinPage),
        data: { [SHELL_TITLE_KEY]: 'households.join.title' },
      },
      {
        path: routePath(PATHS.recurring),
        canActivate: [workspaceGuard],
        loadComponent: () => import('./recurring/pages/recurring-page/recurring-page').then((m) => m.RecurringPage),
        data: { [SHELL_TITLE_KEY]: 'recurring.title', [SHELL_BOOK_BOUND]: true },
      },
      {
        path: routePath(PATHS.operations),
        canActivate: [workspaceGuard],
        loadComponent: () => import('./operations/pages/operations-page/operations-page').then((m) => m.OperationsPage),
        data: { [SHELL_TITLE_KEY]: 'operations.title', [SHELL_BOOK_BOUND]: true },
      },
      {
        path: routePath(PATHS.household),
        loadComponent: () => import('./households/pages/household-page/household.page').then((m) => m.HouseholdPage),
        data: { [SHELL_TITLE_KEY]: 'households.household.title' },
      },
      { path: 'compte', loadComponent: () => identityPages().then((m) => m.AccountPage), data: { [SHELL_TITLE_KEY]: 'identity.account.title' } },
    ],
  },
  {
    path: '',
    component: AuthFrame,
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: routePath(PATHS.signIn) },
      { path: routePath(PATHS.signIn), loadComponent: () => identityPages().then((m) => m.SignInPage) },
      { path: routePath(PATHS.twoFactor), loadComponent: () => identityPages().then((m) => m.TwoFactorPage) },
      { path: routePath(PATHS.signUp), loadComponent: () => identityPages().then((m) => m.SignUpPage) },
      { path: routePath(PATHS.emailCode), loadComponent: () => identityPages().then((m) => m.EmailCodePage) },
      { path: routePath(PATHS.forgotPassword), loadComponent: () => identityPages().then((m) => m.ForgotPasswordPage) },
      { path: routePath(PATHS.resetPassword), redirectTo: PATHS.forgotPassword },
    ],
  },
  {
    path: routePath(PATHS.terms),
    loadComponent: () => import('./legal/legal-placeholder/legal-placeholder').then((m) => m.LegalPlaceholder),
    data: { titleKey: 'legal.terms' },
  },
  {
    path: routePath(PATHS.privacy),
    loadComponent: () => import('./legal/legal-placeholder/legal-placeholder').then((m) => m.LegalPlaceholder),
    data: { titleKey: 'legal.privacy' },
  },
  { path: routePath(PATHS.unavailable), loadComponent: () => identityPages().then((m) => m.UnavailablePage) },
  { path: '**', redirectTo: '' },
];
