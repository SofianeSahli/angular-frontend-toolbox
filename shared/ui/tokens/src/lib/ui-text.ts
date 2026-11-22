import { InjectionToken, Provider } from '@angular/core';

export interface UiTextErrors {
  readonly required: string;
  readonly email: string;
  readonly minlength: string;
  readonly maxlength: string;
  readonly pattern: string;
}

export interface UiText {
  readonly loading: string;
  readonly optional: string;
  readonly close: string;
  readonly cancel: string;
  readonly undo: string;
  readonly clear: string;
  readonly back: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly moreActions: string;
  readonly step: string;
  readonly errors: UiTextErrors & Readonly<Partial<Record<string, string>>>;
}

export type UiTextOverrides = Partial<Omit<UiText, 'errors'>> & { readonly errors?: Readonly<Partial<Record<string, string>>> };

export const DEFAULT_UI_TEXT: UiText = {
  loading: 'Chargement',
  optional: '(facultatif)',
  close: 'Fermer',
  cancel: 'Annuler',
  undo: 'Annuler',
  clear: 'Effacer',
  back: 'Retour',
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  moreActions: "Plus d'actions",
  step: 'Étape {{current}} sur {{total}}',
  errors: {
    required: 'Ce champ est obligatoire.',
    email: 'Saisissez une adresse e-mail valide.',
    minlength: '{{requiredLength}} caractères minimum.',
    maxlength: '{{requiredLength}} caractères maximum.',
    pattern: "Le format n'est pas valide.",
  },
};

export const UI_TEXT = new InjectionToken<UiText>('UI_TEXT', {
  providedIn: 'root',
  factory: () => DEFAULT_UI_TEXT,
});

export function provideUiText(overrides: UiTextOverrides): Provider {
  const { errors, ...rest } = overrides;
  return {
    provide: UI_TEXT,
    useValue: { ...DEFAULT_UI_TEXT, ...rest, errors: { ...DEFAULT_UI_TEXT.errors, ...errors } } satisfies UiText,
  };
}

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

export function fillUiText(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(PLACEHOLDER, (placeholder, name: string) => (Object.hasOwn(values, name) ? String(values[name]) : placeholder));
}
