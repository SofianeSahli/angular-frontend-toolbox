import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { olivierTheme } from '@shared/theme-olivier';
import { UiLabel, UiSelect } from '@shared/ui-atoms';
import { THEME_CHOICES, UiThemeService, isThemeChoice } from '@shared/ui-tokens';
import { CatalogDirection } from '../catalog-direction';

const THEME_LABELS: Readonly<Record<string, string>> = { light: 'Clair', dark: 'Sombre', system: 'Système' };

function selectedValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : '';
}

@Component({
  selector: 'app-catalog-toolbar',
  imports: [RouterLink, UiLabel, UiSelect],
  templateUrl: './catalog-toolbar.html',
  styleUrl: './catalog-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.catalog-toolbar--floating]': 'floating()',
  },
})
export class CatalogToolbar {
  readonly floating = input(false, { transform: booleanAttribute });

  protected readonly theme = inject(UiThemeService);
  protected readonly direction = inject(CatalogDirection);
  protected readonly themeChoices = THEME_CHOICES.map((value) => ({ value, label: THEME_LABELS[value] }));
  protected readonly accents = olivierTheme.accents;

  protected chooseTheme(event: Event): void {
    const value = selectedValue(event);
    if (isThemeChoice(value)) this.theme.setChoice(value);
  }

  protected chooseAccent(event: Event): void {
    this.theme.setAccent(selectedValue(event));
  }

  protected chooseDirection(event: Event): void {
    this.direction.set(selectedValue(event) === 'rtl' ? 'rtl' : 'ltr');
  }
}
