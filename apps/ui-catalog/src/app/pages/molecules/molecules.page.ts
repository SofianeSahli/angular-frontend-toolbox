import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiAmount, UiAvatar, UiButton, UiIcon, UiInput, UiSelect } from '@shared/ui-atoms';
import {
  UiAlert,
  UiAvatarGroup,
  UiChipGroup,
  UiCodeInput,
  UiEmptyState,
  UiFieldAction,
  UiFieldAffix,
  UiFormField,
  UiList,
  UiListItem,
  UiMenu,
  UiMenuItem,
  UiMenuItemRadio,
  UiMenuTrigger,
  UiMonthSwitcher,
  UiOptionCards,
  UiSearchField,
  UiSectionHeader,
  UiSegmentedControl,
  UiStat,
  UiStepper,
} from '@shared/ui-molecules';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Dépense' },
  { value: 'income', label: 'Revenu' },
  { value: 'transfer', label: 'Transfert', disabled: true },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tout' },
  { value: 'expenses', label: 'Dépenses', count: 24 },
  { value: 'income', label: 'Revenus', count: 1 },
];

const START_OPTIONS = [
  { value: 'household', title: 'Un foyer', description: 'Partagez les dépenses avec les membres.', icon: 'house' },
  { value: 'solo', title: 'Moi seulement', description: 'Suivez vos dépenses personnelles.' },
];

const MEMBERS = [{ name: 'Sofiane' }, { name: 'Amira', member: 2 as const }, { name: 'Youssef', member: 3 as const }, { name: 'Leïla' }];

@Component({
  selector: 'app-molecules-page',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    UiAmount,
    UiAvatar,
    UiButton,
    UiIcon,
    UiInput,
    UiSelect,
    UiAlert,
    UiAvatarGroup,
    UiChipGroup,
    UiCodeInput,
    UiEmptyState,
    UiFieldAction,
    UiFieldAffix,
    UiFormField,
    UiList,
    UiListItem,
    UiMenu,
    UiMenuItem,
    UiMenuItemRadio,
    UiMenuTrigger,
    UiMonthSwitcher,
    UiOptionCards,
    UiSearchField,
    UiSectionHeader,
    UiSegmentedControl,
    UiStat,
    UiStepper,
  ],
  templateUrl: './molecules.page.html',
  styleUrl: '../catalog-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoleculesPage {
  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly filterOptions = FILTER_OPTIONS;
  protected readonly startOptions = START_OPTIONS;
  protected readonly members = MEMBERS;
  protected readonly month = signal('2026-11');
  protected readonly query = signal('');
  protected readonly showPassword = signal(false);
  protected readonly book = signal('foyer');

  protected readonly form = new FormGroup({
    name: new FormControl('Foyer Sahli', [Validators.required, Validators.maxLength(60)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    type: new FormControl('expense'),
    filter: new FormControl<unknown>('all'),
    start: new FormControl('household'),
    code: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });
  protected readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
}
