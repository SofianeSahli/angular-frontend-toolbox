import { Component, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DynamicComponentInterface } from '../modal-wrapper-component/modal-wrapper-component.component';

@Component({
  selector: 'lib-confirmation-modal',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="modal-body">
      <p>{{ message() }}</p>
    </div>
  `,
})
export class ConfirmationModalComponent
  implements DynamicComponentInterface<boolean>
{
  message = signal('Are you sure?');
  done = output<boolean>();

  activeModal = inject(NgbActiveModal);

  submit() {
    this.done.emit(true);
    this.activeModal.close(true);
  }

  onCancel() {
    this.done.emit(false);
    this.activeModal.dismiss(false);
  }
}
