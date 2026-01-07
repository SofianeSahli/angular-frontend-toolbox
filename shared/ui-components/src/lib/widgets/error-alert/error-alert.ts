import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'lib-error-alert',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './error-alert.html',
  styleUrl: './error-alert.scss',
})
export class ErrorAlert {
  errors = signal<string[] | null>(null);
  modal = inject(NgbActiveModal);


}
