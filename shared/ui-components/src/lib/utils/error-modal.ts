import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Signal, effect } from '@angular/core';
import { ErrorAlert } from '../widgets/error-alert/error-alert';

export function attachErrorModalEffect(
  errorSignal: Signal<string[] | null>,
  modalService: NgbModal
) {
  let modalRef: NgbModalRef | null = null;

  effect(() => {
    const errors = errorSignal();
    if (errors) {
      if (!modalRef) {
        modalRef = modalService.open(ErrorAlert, {
          centered: true,
          size: 'md',
        });
        modalRef.componentInstance.errors = errors;
        modalRef.result.finally(() => {
          modalRef = null;
        });
      }
    } else {
      if (modalRef) {
        modalRef.close();
        modalRef = null;
      }
    }
  });
}
