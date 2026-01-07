import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { authStore } from '@shared/auth';
import { User } from '@shared/stores';
import { Loader, TextInput } from '@shared/ui-components';
import { PROFILE_FORM } from './profile.form';

@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    Loader,
    TranslateModule,
    CommonModule, TextInput
  ],
})
export class ProfileFormComponent {
  store = inject(authStore);
  user = this.store.profile;
  loading = this.store.isLoading();
  fields: FormlyFieldConfig[] = PROFILE_FORM;
  mailControl = new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)


  ])
  profileForm: FormGroup = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    phone_number: new FormControl('', Validators.required),
    email: this.mailControl,
  });
  router = inject(Router);

  constructor() {
    effect(() => {
      if (this.user?.()) {
        this.loadUserData(this.user() as User);
      }
    });
  }

  loadUserData(userData: User): void {
    this.profileForm.patchValue({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone_number: userData.phone_number || '',
      email: userData.email || '',
    });
  }

  submit() {
    if (this.profileForm.valid) {
      this.store.updateProfile(this.profileForm.getRawValue());
    }
  }

  onCancel() {
    this.router.navigate(['..']);
  }
}
