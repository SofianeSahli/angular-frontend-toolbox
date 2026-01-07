import { Injectable, signal } from '@angular/core';
import { Subject, throttleTime } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  // Exposer un signal directement
  loadMoreSignal = signal(false);
  private loadMoreSubject = new Subject<void>();

  constructor() {
    this.loadMoreSubject
      .pipe(throttleTime(1500))
      .subscribe(() => {
        this.loadMoreSignal.set(true);
        setTimeout(() => this.loadMoreSignal.set(false), 100);
      });
  }

  triggerLoadMore() {
    this.loadMoreSubject.next();
  }
}