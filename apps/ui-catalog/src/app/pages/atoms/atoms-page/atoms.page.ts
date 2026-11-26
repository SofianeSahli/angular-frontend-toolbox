import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { CatalogDirection } from '../../../shell/catalog-direction';

const CATEGORY_ICONS = [
  { name: 'shopping-cart', color: 'var(--ui-color-data-1)' },
  { name: 'car', color: 'var(--ui-color-data-6)' },
  { name: 'coffee', color: 'var(--ui-color-data-2)' },
  { name: 'zap', color: 'var(--ui-color-data-9)' },
  { name: 'pill', color: 'var(--ui-color-data-8)' },
  { name: 'arrow-up', color: 'var(--ui-color-success)' },
];

@Component({
  selector: 'app-atoms-page',
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
  templateUrl: './atoms.page.html',
  styleUrl: '../../catalog-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtomsPage {
  protected readonly direction = inject(CatalogDirection);
  protected readonly categoryIcons = CATEGORY_ICONS;
  protected readonly pressedChip = signal('all');

  protected readonly form = new FormGroup({
    description: new FormControl('Carrefour Market'),
    category: new FormControl('food'),
    recurring: new FormControl(true),
    type: new FormControl('expense'),
    reminder: new FormControl(false),
  });
  protected readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
}
