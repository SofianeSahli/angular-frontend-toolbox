import { IdentityConfig } from './identity-config';

export const IDENTITY_TEST_CONFIG: IdentityConfig = {
  termsVersion: '2026-11',
  afterSignIn: '/',
  paths: {
    signIn: '/connexion',
    signUp: '/inscription',
    emailCode: '/inscription/code',
    twoFactor: '/connexion/code',
    forgotPassword: '/mot-de-passe-oublie',
    resetPassword: '/mot-de-passe/nouveau',
    unavailable: '/indisponible',
    terms: '/conditions',
    privacy: '/confidentialite',
  },
};
