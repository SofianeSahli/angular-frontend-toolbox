import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdatePasswordFormComponent } from './update-password-form/update-password-form.component';
import { AppModalWrapperComponent } from '@shared/ui-components';


@Component({
  imports: [FormsModule],
  selector: 'app-security-settings',
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.scss'],
})
export class SecuritySettingsComponent implements OnInit {
  recoveryEmail: string = '';
  phoneNumber: string = '';
  searchTerm: string = '';
  modalService = inject(NgbModal);
  
  ngOnInit(): void {

  }

  saveRecoveryEmail() {
    // TODO: call backend API to save email
    console.log('Saving recovery email:', this.recoveryEmail);
    alert(`Email de récupération mis à jour: ${this.recoveryEmail}`);
  }

  enableSms2FA() {
    // TODO: call backend API to enable SMS 2FA
    console.log('Enabling SMS 2FA for:', this.phoneNumber);
    alert(`Authentification SMS activée pour: ${this.phoneNumber}`);
  }

  openAppAuthModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'md' });
  }

  openPasswordModal() {
    const modalRef = this.modalService.open(AppModalWrapperComponent, {
      centered: true,
      size: 'xl',
    });

    modalRef.componentInstance.title = 'Mise à jour de votre mot de passe';
    modalRef.componentInstance.contentComponent = UpdatePasswordFormComponent;

    modalRef.closed.subscribe(() => {});
  }

  openActivityModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'lg' });
  }
}
