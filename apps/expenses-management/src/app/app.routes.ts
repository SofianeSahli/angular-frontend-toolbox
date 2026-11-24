import { Route } from '@angular/router';
import { SHELL_TITLE_KEY, SignedInShell } from '@expenses/shell';
import { authGuard, guestGuard } from '@shared/identity-data-access';
import { AuthFrame } from './auth-frame/auth-frame';

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
} as const;

const identityPages = () => import('@shared/identity-feature-auth');
const routePath = (path: string) => path.slice(1);

export const appRoutes: Route[] = [
  {
    path: '',
    component: AuthFrame,
    canActivate: [guestGuard],
    children: [
      { path: routePath(PATHS.signIn), loadComponent: () => identityPages().then((m) => m.SignInPage) },
      { path: routePath(PATHS.twoFactor), loadComponent: () => identityPages().then((m) => m.TwoFactorPage) },
      { path: routePath(PATHS.signUp), loadComponent: () => identityPages().then((m) => m.SignUpPage) },
      { path: routePath(PATHS.emailCode), loadComponent: () => identityPages().then((m) => m.EmailCodePage) },
      { path: routePath(PATHS.forgotPassword), loadComponent: () => identityPages().then((m) => m.ForgotPasswordPage) },
      { path: routePath(PATHS.resetPassword), loadComponent: () => identityPages().then((m) => m.ResetPasswordPage) },
    ],
  },
  {
    path: '',
    component: SignedInShell,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./home/home').then((m) => m.Home), data: { [SHELL_TITLE_KEY]: 'home.title' } },
      { path: 'compte', loadComponent: () => identityPages().then((m) => m.AccountPage), data: { [SHELL_TITLE_KEY]: 'identity.account.title' } },
    ],
  },
  {
    path: routePath(PATHS.terms),
    loadComponent: () => import('./legal/legal-placeholder').then((m) => m.LegalPlaceholder),
    data: { titleKey: 'legal.terms' },
  },
  {
    path: routePath(PATHS.privacy),
    loadComponent: () => import('./legal/legal-placeholder').then((m) => m.LegalPlaceholder),
    data: { titleKey: 'legal.privacy' },
  },
  { path: routePath(PATHS.unavailable), loadComponent: () => identityPages().then((m) => m.UnavailablePage) },
  { path: '**', redirectTo: '' },
];
