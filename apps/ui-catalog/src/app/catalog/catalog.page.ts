import { DOCUMENT, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { olivierTheme } from '@shared/theme-olivier';
import {
  UiAmount,
  UiAvatar,
  UiBadge,
  UiButton,
  UiCheckRow,
  UiCheckbox,
  UiChip,
  UiFieldMessage,
  UiIcon,
  UiInput,
  UiKbd,
  UiLabel,
  UiProgress,
  UiRadio,
  UiSelect,
  UiSkeleton,
  UiSpinner,
  UiSwitch,
} from '@shared/ui-atoms';
import { THEME_CHOICES, UiThemeService, isThemeChoice } from '@shared/ui-tokens';

type Direction = 'ltr' | 'rtl';

function selectedValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : '';
}

const THEME_LABELS: Record<string, string> = { light: 'Clair', dark: 'Sombre', system: 'Système' };
const CATEGORY_ICONS = [
  { name: 'shopping-cart', color: 'var(--ui-color-data-1)' },
  { name: 'car', color: 'var(--ui-color-data-6)' },
  { name: 'coffee', color: 'var(--ui-color-data-2)' },
  { name: 'zap', color: 'var(--ui-color-data-9)' },
  { name: 'pill', color: 'var(--ui-color-data-8)' },
  { name: 'arrow-up', color: 'var(--ui-color-success)' },
];

@Component({
  selector: 'app-catalog-page',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    UiAmount,
    UiAvatar,
    UiBadge,
    UiButton,
    UiCheckRow,
    UiCheckbox,
    UiChip,
    UiFieldMessage,
    UiIcon,
    UiInput,
    UiKbd,
    UiLabel,
    UiProgress,
    UiRadio,
    UiSelect,
    UiSkeleton,
    UiSpinner,
    UiSwitch,
  ],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage {
  protected readonly theme = inject(UiThemeService);
  private readonly document = inject(DOCUMENT);

  protected readonly themeChoices = THEME_CHOICES.map((value) => ({ value, label: THEME_LABELS[value] }));
  protected readonly accents = olivierTheme.accents;
  protected readonly categoryIcons = CATEGORY_ICONS;
  protected readonly direction = signal<Direction>(this.document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
  protected readonly pressedChip = signal('all');

  protected readonly form = new FormGroup({
    description: new FormControl('Carrefour Market'),
    category: new FormControl('food'),
    recurring: new FormControl(true),
    type: new FormControl('expense'),
    reminder: new FormControl(false),
  });
  protected readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected chooseTheme(event: Event): void {
    const value = selectedValue(event);
    if (isThemeChoice(value)) this.theme.setChoice(value);
  }

  protected chooseAccent(event: Event): void {
    this.theme.setAccent(selectedValue(event));
  }

  protected chooseDirection(event: Event): void {
    const direction: Direction = selectedValue(event) === 'rtl' ? 'rtl' : 'ltr';
    this.direction.set(direction);
    this.document.documentElement.dir = direction;
  }
}
