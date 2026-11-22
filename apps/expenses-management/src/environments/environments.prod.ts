export const environment = {
  production: true,
  // TODO(deploy): placeholder. Replace with the real production API before the first deployment.
  // The one API base URL for this app (spec 001, REQ-5.6).
  apiBaseUrl: 'https://api.example.invalid/api/v1',
  homeRoute: '/dashboard',
  loginUrl: '/auth/login',
  validateEndpoint: '/auth/validate',
  loginEndpoint: '/auth/login',
  refreshEndpoint: '/auth/refresh',
  checkUsernameEndpoint: '/auth/check-username',
  registerEndpoint: '/auth/register',
  updatePasswordEndpoint: '/auth/update-password',
  profileEndpoint: '/profile',
  categoriesEndpoint : '/categories'
};
