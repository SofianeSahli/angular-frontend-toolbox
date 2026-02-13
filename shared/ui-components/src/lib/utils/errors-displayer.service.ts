import { Injectable, effect, signal } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ErrorAlert } from '../widgets/error-alert/error-alert';

@Injectable({ providedIn: 'root' })
export class GlobalErrorModalService {
  private errorSignal = signal<string[] | null>(null);
  private modalRef: NgbModalRef | null = null;
  private alreadyDisplaying : boolean= false 
  constructor(private modal: NgbModal) {
    effect(() => {
      const errors = this.errorSignal();

      if (errors && !this.modalRef) {
        this.modalRef = this.modal.open(ErrorAlert, {
          centered: true,
          size: 'md',
        });

        this.modalRef.componentInstance.errors.set( errors) ;

        this.modalRef.result.finally(() => {
          this.modalRef = null;
          this.errorSignal.set(null);
        });
      }
    });
  }

  show(errors: string[]) {
    this.errorSignal.set(errors);
  }
}
