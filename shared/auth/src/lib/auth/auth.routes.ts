import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { RequestResetPassword } from './reset-password/request-reset-password/request-reset-password';
import { ResetPassword } from './reset-password/reset-password/reset-password';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Login,
  },
  {
    path: 'register',
    pathMatch: 'full',
    component: Register,
  }, {
    path: 'reset-password',
    pathMatch: 'full',
    component: RequestResetPassword
  }, {
    path: 'reset-password/:token',
    pathMatch: 'full',
    component: ResetPassword
  }
];
