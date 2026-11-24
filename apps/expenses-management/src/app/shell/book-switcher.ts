import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiMenu, UiMenuItem, UiMenuItemRadio, UiMenuTrigger } from '@shared/ui-molecules';
import { BooksStore } from '../households/data/books.store';

export type BookSwitcherVariant = 'rail' | 'bar';

@Component({
  selector: 'app-book-switcher',
  imports: [TranslatePipe, UiButton, UiIcon, UiMenu, UiMenuItem, UiMenuItemRadio, UiMenuTrigger],
  template: `
    @if (books.selectedBook(); as current) {
      <button uiButton variant="ghost" type="button" [class.w-100]="variant() === 'rail'" [uiMenuTriggerFor]="menu">
        <span class="visually-hidden">{{ 'shell.books.switcher' | translate }} :</span>
        <bdi class="text-truncate">{{ current.name }}</bdi>
        <ui-icon name="chevron-down" />
      </button>
      <ng-template #menu>
        <ui-menu>
          @for (book of ordered(); track book.id) {
            <button
              uiMenuItem
              [checked]="book.id === current.id"
              [icon]="book.owner.type === 'household' ? 'house' : undefined"
              (triggered)="books.select(book.id)"
            >
              <bdi>{{ book.name }}</bdi>
            </button>
          }
          <button uiMenuItem icon="plus" [disabled]="!books.canCreatePersonalBook()" (triggered)="newBook()">
            {{ 'shell.books.new' | translate }}
            @if (!books.canCreatePersonalBook()) {
              <span class="d-block small">{{ 'shell.books.limit' | translate }}</span>
            }
          </button>
        </ui-menu>
      </ng-template>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSwitcher {
  protected readonly books = inject(BooksStore);
  private readonly router = inject(Router);

  readonly variant = input<BookSwitcherVariant>('bar');

  protected readonly ordered = computed(() => {
    const household = this.books.householdBook();
    return household === null ? this.books.personalBooks() : [...this.books.personalBooks(), household];
  });

  protected newBook(): void {
    void this.router.navigateByUrl('/carnets/nouveau');
  }
}
