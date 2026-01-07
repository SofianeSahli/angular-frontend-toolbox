import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '@shared/stores';
import { Observable, switchMap } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  httpClient = inject(HttpClient);
  config = inject(AUTH_CONFIG);

  get(): Observable<User> {
    return this.httpClient.get<User>(
      this.config.profileBaseUrl! + this.config.profileEndpoint!
    );
  }
  private toFormData(user: Partial<User>): FormData {
    const formData = new FormData();
    const data: Record<string, any> = {};

    Object.entries(user).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (
          Array.isArray(value) &&
          value.every((v) => v instanceof File)
        ) {
          value.forEach((file) => formData.append(key, file));
        } else if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          data[key] = value;
        } else {
          data[key] = value;
        }
      }
    });
    formData.append('data', JSON.stringify(data));
    return formData;
  }

  patchProfile(profileData: User): Observable<User> {
    return this.httpClient.post(
      this.config.apiBaseUrl + '/auth/update-email-phone', {
      email: profileData.email ?? '', phone: profileData.phone_number ?? ''
    }
    ).pipe(switchMap(value => this.httpClient.post<User>(
      this.config.profileBaseUrl! + this.config.profileEndpoint!,
      profileData
    )));
  }

  getById(id: string): Observable<User> {
    return this.httpClient.get<User>(
      this.config.profileEndpoint ?? 'profile' + '/' + id
    );
  }
}
