import { InjectionToken } from '@angular/core';

export interface AuthConfig {
  apiBaseUrl: string;
  homeRoute: string;
  loginUrl: string;
  validateEndpoint?: string;
  upadteAuthEmailPhoneEndpoint?: string,
  loginEndpoint?: string;
  refreshEndpoint?: string;
  checkUsernameEndpoint?: string;
  registerEndpoint?: string;
  updatePasswordEndpoint?: string;
  profileEndpoint?: string
  profileBaseUrl?: string // TODO implement a proper gateway
  logoutEndpoint?: string
  requestResetPassword?: string,
  resetPassword?: string
}
export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');


