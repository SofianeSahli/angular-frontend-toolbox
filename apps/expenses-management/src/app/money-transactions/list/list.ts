import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
import {
  AppModalWrapperComponent,
  listStaggerAnimation,
  Loader,
  ScrollService,
} from '@shared/ui-components';
import { Filter } from '../filter/filter';
import { Form } from '../form/form';
import { ListItems } from '../list-items/list-items';
import { moneyTransitionSignalStore } from '../state/money-transitions/money-transition.signal';

@Component({
  selector: 'app-list',
  imports: [ListItems, TranslatePipe, Loader],
  templateUrl: './list.html',
  styleUrl: './list.scss',
  animations: [listStaggerAnimation],
})
export class List {
  moneyTransitionStore = inject(moneyTransitionSignalStore);
  modalService = inject(NgbModal);
  items = computed(() => this.moneyTransitionStore.entities());
  scrollService = inject(ScrollService);
  isLoadingMore = computed(() =>
    this.moneyTransitionStore.isLoading()
  );

  private isProcessingLoadMore = signal(false);

  constructor() {
    effect(() => {
      const shouldLoad = this.scrollService.loadMoreSignal() &&
        this.moneyTransitionStore.canLoadMore() &&
        !this.moneyTransitionStore.isLoading() &&
        !this.isProcessingLoadMore();

      if (shouldLoad) {
        this.isProcessingLoadMore.set(true);
        queueMicrotask(() => {
          this.loadMore();
          this.isProcessingLoadMore.set(false);
        });

      }
    });
  }

  addEntry() {
    const modalRef = this.modalService.open(AppModalWrapperComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.title.set('labels.money_movement_form');
    modalRef.componentInstance.contentComponent.set(Form);
  }

  filter() {
    const modalRef = this.modalService.open(AppModalWrapperComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.title.set('labels.money_movement_form');
    modalRef.componentInstance.contentComponent.set(Filter);
  }

  loadMore() {
    const query = this.moneyTransitionStore.query()
    if (query && query.page !== undefined) {
      this.moneyTransitionStore.load({ ...query, page: query.page + 1 });

    }
  }
}
