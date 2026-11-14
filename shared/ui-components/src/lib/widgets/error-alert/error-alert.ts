
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'lib-error-alert',
  imports: [TranslatePipe],
  templateUrl: './error-alert.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './error-alert.scss',
})
export class ErrorAlert {
  errors = signal<string[] | null>(null);
  modal = inject(NgbActiveModal);


}
