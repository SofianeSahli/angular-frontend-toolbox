import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiAmount, UiAvatar, UiButton, UiIcon, UiInput, UiSelect } from '@shared/ui-atoms';
import {
  UiAlert,
  UiAmountKeypad,
  UiAvatarGroup,
  UiBarItem,
  UiBarList,
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
  UiMeter,
  UiMonthStrip,
  UiMonthStripItem,
  UiMonthSwitcher,
  UiOptionCards,
  UiPaceChart,
  UiSaveBar,
  UiSearchField,
  UiSectionHeader,
  UiSegmentedControl,
  UiStat,
  UiStepper,
  UiTrendBars,
  UiTrendItem,
  UiPacePoint,
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

const BARS: readonly UiBarItem[] = [
  { id: 'food', label: 'Alimentation', value: 540000, valueText: '540 DT', shareText: '45 %', clickable: true },
  { id: 'home', label: 'Maison', value: 400000, valueText: '400 DT', shareText: '33 %', clickable: true },
  { id: 'transport', label: 'Transport', value: 160000, valueText: '160 DT', shareText: '13 %', clickable: true },
  { id: 'others', label: 'Autres catégories', value: 100000, valueText: '100 DT', shareText: '8 %' },
];

const LONG_BARS: readonly UiBarItem[] = [
  { id: 'a', label: 'Abonnements numériques, logiciels et services en ligne de toute la famille', value: 85000, valueText: '85 DT' },
  { id: 'b', label: 'Sofiane', value: 1250000, valueText: '1 250 DT' },
];

const MEMBERS = [{ name: 'Sofiane' }, { name: 'Amira', member: 2 as const }, { name: 'Youssef', member: 3 as const }, { name: 'Leïla' }];

const cumulative = (daily: readonly number[]): UiPacePoint[] =>
  daily.reduce<UiPacePoint[]>((points, amount, index) => [...points, { day: index + 1, value: (points[index - 1]?.value ?? 0) + amount }], []);

const PACE_NORMAL = cumulative([40, 0, 120, 60, 0, 80, 150, 20, 0, 90, 60, 100]);
const PACE_OVER = cumulative([200, 150, 300, 0, 250, 180, 120, 0, 200, 150, 100, 160]);
const TREND_ITEMS: UiTrendItem[] = [
  { id: '2026-06', label: 'juin', value: 1250, valueText: '1 250 DT' },
  { id: '2026-07', label: 'juil.', value: 980, valueText: '980 DT' },
  { id: '2026-08', label: 'août', value: 0, valueText: '0 DT' },
  { id: '2026-09', label: 'sept.', value: 1430, valueText: '1 430 DT' },
  { id: '2026-10', label: 'oct.', value: 1100, valueText: '1 100 DT' },
  { id: '2026-11', label: 'nov.', value: 760, valueText: '760 DT', current: true },
];

const STRIP_MONTHS: readonly UiMonthStripItem[] = [
  { month: '2026-09', label: 'sept.', caption: '26', status: 'closed', statusLabel: 'Clos' },
  { month: '2026-10', label: 'oct.', caption: '26', status: 'closed', statusLabel: 'Clos' },
  { month: '2026-11', label: 'nov.', caption: '26', status: 'current', statusLabel: 'En cours' },
  { month: '2026-12', label: 'déc.', caption: '26', status: 'planned', statusLabel: 'Prévu' },
  { month: '2027-01', label: 'janv.', caption: '27', status: 'todo', statusLabel: 'À faire' },
  { month: '2027-02', label: 'févr.', caption: '27' },
];

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
    UiAmountKeypad,
    UiAvatarGroup,
    UiBarList,
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
    UiMeter,
    UiMonthStrip,
    UiMonthSwitcher,
    UiOptionCards,
    UiPaceChart,
    UiSaveBar,
    UiSearchField,
    UiSectionHeader,
    UiSegmentedControl,
    UiStat,
    UiStepper,
    UiTrendBars,
  ],
  templateUrl: './molecules.page.html',
  styleUrl: '../../catalog-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoleculesPage {
  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly filterOptions = FILTER_OPTIONS;
  protected readonly startOptions = START_OPTIONS;
  protected readonly members = MEMBERS;
  protected readonly bars = BARS;
  protected readonly singleBar = BARS.slice(0, 1);
  protected readonly longBars = LONG_BARS;
  protected readonly selectedBar = signal<string | null>(null);
  protected readonly paceNormal = PACE_NORMAL;
  protected readonly paceOver = PACE_OVER;
  protected readonly paceReference = PACE_NORMAL.map((point) => Math.round(point.value * 1.1));
  protected readonly trendItems = TREND_ITEMS;
  protected readonly selectedTrend = signal<string | null>(null);
  protected readonly month = signal('2026-11');
  protected readonly query = signal('');
  protected readonly showPassword = signal(false);
  protected readonly book = signal('foyer');
  protected readonly keypadAmount = signal('12,5');
  protected readonly keypadWhole = signal('');
  protected readonly stripMonths = STRIP_MONTHS;
  protected readonly stripMonth = signal('2026-11');
  protected readonly saveBarBusy = signal(false);

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
