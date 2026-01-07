import { Component, signal } from '@angular/core';
import { UpdatePasswordFormComponent } from '@shared/auth';
import { routeAnimations, SwitchButtons } from '@shared/ui-components';
import { ProfileFormComponent } from "./profile-form/profile-form.component";

@Component({
  selector: 'app-parameters',
  imports: [UpdatePasswordFormComponent, ProfileFormComponent, SwitchButtons],
  templateUrl: './parameters.html',
  styleUrl: './parameters.scss',
  animations: [routeAnimations]
})
export class Parameters {
  tabOptions = [
    {
      label: 'labels.profile',
      value: 'labels.profile'
    },
    {
      label: 'labels.update_password',
      value: 'labels.update_password'
    },
    {
      label: 'labels.sessions_history',
      value: 'labels.sessions_history'
    }
  ]
  showingItem = signal<'labels.profile' | 'labels.update_password' |
    'labels.sessions_history'>('labels.profile')


  changeView($event: string) {
    //@ts-expect-error string missmatch 
    this.showingItem = $event

  }
}
