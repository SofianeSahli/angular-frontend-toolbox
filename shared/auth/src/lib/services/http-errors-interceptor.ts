import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ErrorAlert } from '@shared/ui-components';
import { tap } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const modalService = inject(NgbModal);

  return next(req).pipe(
    tap({
      error: (error: unknown) => {
        if (!(error instanceof HttpErrorResponse)) {
          return
        };

        let messages: string[] = [];
        let errors
        if (typeof error.error === 'string') {
          errors = JSON.parse(error.error);
        } else {
          errors = error.error;
        }
        if (error.status === 0) {
          messages.push('Network error: please check your connection.');
        } else if (error.status >= 400 && error.status < 500 && errors) {
          if (typeof errors.message === 'string') {
            messages.push(errors.message);
          } else if (Array.isArray(errors.message)) {
            messages = errors.message;
          } else if (errors.message) {
            messages.push(String(errors.message));
          } else {
            messages.push(`Client error occurred (${errors.message}).`);
          }
        } else if (error.status >= 500) {
          messages.push('Server error — please try again later.');
        } else {
          messages.push('An unexpected error occurred.');
        }

        if (messages.length === 0) {
          messages.push('An unknown error occurred.');
        }


        const modalRef = modalService.open(ErrorAlert, {
          centered: true,
          size: 'md',
          backdrop: 'static',
        });

        modalRef.componentInstance.errors.set(messages);
      },
    })
  );
};