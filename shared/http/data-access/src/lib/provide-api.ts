import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { API_CONFIG, ApiConfig } from './api-config';
import { apiInterceptor } from './api.interceptor';

export function provideApi(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: API_CONFIG, useValue: config }, provideHttpClient(withFetch(), withInterceptors([apiInterceptor]))]);
}
