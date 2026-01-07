import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollService, ToastComponent } from '@shared/ui-components';

@Component({
  imports: [RouterModule, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'expenses-management';
  scrollService = inject(ScrollService);

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight < element.scrollTop + element.clientHeight + 2) {
      this.scrollService.triggerLoadMore();
    }
  }
}
