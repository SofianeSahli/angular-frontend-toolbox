import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiMenu, UiMenuItem, UiMenuItemRadio, UiMenuTrigger } from '@shared/ui-molecules';
import { BooksStore } from '../../households/data/books.store';

export type BookSwitcherVariant = 'rail' | 'bar';

@Component({
  selector: 'app-book-switcher',
  imports: [TranslatePipe, UiButton, UiIcon, UiMenu, UiMenuItem, UiMenuItemRadio, UiMenuTrigger],
  templateUrl: './book-switcher.html',
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
