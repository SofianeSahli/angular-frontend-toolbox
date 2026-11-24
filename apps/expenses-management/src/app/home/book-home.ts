import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiPage } from '@shared/ui-templates';
import { BooksStore } from '../households/data/books.store';

@Component({
  selector: 'app-book-home',
  imports: [TranslatePipe, UiPage],
  templateUrl: './book-home.html',
  styleUrl: './book-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookHome {
  protected readonly book = inject(BooksStore).selectedBook;
}
