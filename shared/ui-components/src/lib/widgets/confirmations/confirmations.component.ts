import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DynamicComponentInterface } from '../modal-wrapper-component/modal-wrapper-component.component';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
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

  constructor(public activeModal: NgbActiveModal) {}

  submit() {
    this.done.emit(true);
    this.activeModal.close(true);
  }

  onCancel() {
    this.done.emit(false);
    this.activeModal.dismiss(false);
  }
}
