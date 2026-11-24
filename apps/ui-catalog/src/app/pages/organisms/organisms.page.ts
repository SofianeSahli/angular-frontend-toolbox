import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiAmount, UiButton, UiIcon, UiInput, UiLabel, UiSelect } from '@shared/ui-atoms';
import { UiListItem, UiSearchField } from '@shared/ui-molecules';
import {
  UI_DIALOG_CONTEXT,
  UiBottomTabs,
  UiConfirm,
  UiDialog,
  UiDialogBody,
  UiDialogFooter,
  UiDialogHeader,
  UiDialogPresentation,
  UiFilterBar,
  UiGroupedList,
  UiListGroup,
  UiRailItem,
  UiRailSection,
  UiSideRail,
  UiTab,
  UiTabAction,
  UiTable,
  UiTableGroup,
  UiTableNumber,
  UiToast,
  UiToastRegion,
  UiTopBar,
} from '@shared/ui-organisms';

interface Operation {
  readonly label: string;
  readonly category: string;
  readonly millimes: number;
}

const DAYS: readonly UiListGroup<Operation>[] = [
  {
    key: '2026-11-22',
    label: 'Dimanche 22 novembre',
    total: '-63,350 DT',
    items: [
      { label: 'Carrefour Market', category: 'Alimentation', millimes: 48350 },
      { label: 'Pharmacie', category: 'Santé', millimes: 15000 },
    ],
  },
  { key: '2026-11-21', label: 'Samedi 21 novembre', total: '-950,000 DT', items: [{ label: 'Loyer', category: 'Logement', millimes: 950000 }] },
];

@Component({
  imports: [UiDialogHeader, UiDialogBody, UiDialogFooter, UiButton, UiLabel, UiInput],
  template: `<ui-dialog-header title="Nouvelle dépense" />
    <div uiDialogBody>
      <label uiLabel for="demo-amount">Montant</label>
      <input uiInput id="demo-amount" inputmode="decimal" placeholder="ex. 12,500" />
    </div>
    <div uiDialogFooter>
      <button uiButton type="button" (click)="context.close()">Annuler</button>
      <button uiButton variant="primary" type="button" (click)="context.close('saved')">Enregistrer</button>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDialogDemo {
  protected readonly context = inject(UI_DIALOG_CONTEXT);
}

@Component({
  selector: 'app-organisms-page',
  imports: [
    UiAmount,
    UiButton,
    UiIcon,
    UiSelect,
    UiListItem,
    UiSearchField,
    UiBottomTabs,
    UiFilterBar,
    UiGroupedList,
    UiRailItem,
    UiRailSection,
    UiSideRail,
    UiTab,
    UiTabAction,
    UiTable,
    UiTableGroup,
    UiTableNumber,
    UiToastRegion,
    UiTopBar,
  ],
  templateUrl: './organisms.page.html',
  styleUrl: '../catalog-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganismsPage {
  private readonly dialog = inject(UiDialog);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);

  protected readonly days = DAYS;
  protected readonly query = signal('');
  protected readonly loading = signal(false);
  protected readonly lastAnswer = signal('');

  protected openDialog(presentation: UiDialogPresentation): void {
    this.dialog.open(ExpenseDialogDemo, { presentation });
  }

  protected async askDelete(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Supprimer ce carnet ?',
      message: 'Toutes ses dépenses seront supprimées pour tous les membres.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    this.lastAnswer.set(confirmed ? 'Confirmé' : 'Annulé');
  }

  protected async askArchive(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Archiver novembre ?',
      message: 'Le mois restera consultable.',
      confirmLabel: 'Archiver',
    });
    this.lastAnswer.set(confirmed ? 'Confirmé' : 'Annulé');
  }

  protected showToast(tone: 'neutral' | 'success' | 'danger'): void {
    if (tone === 'neutral') {
      this.toast.show({ message: 'Dépense supprimée.', action: { label: 'Annuler', run: () => this.toast.show({ message: 'Dépense restaurée.', tone: 'success' }) } });
    } else if (tone === 'success') {
      this.toast.show({ message: 'Dépense ajoutée.', tone: 'success' });
    } else {
      this.toast.show({ message: 'Connexion perdue. Vos changements seront envoyés plus tard.', tone: 'danger' });
    }
  }
}
