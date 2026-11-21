export const environment = {
  production: false,
  // The one API base URL for this app (spec 001, REQ-5.6). Dev: the rebuilt backend.
  apiBaseUrl: 'http://localhost:8001/api/v1',
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
