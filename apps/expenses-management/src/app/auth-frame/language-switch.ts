import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { UiSegmentedControl, UiSegmentedOption } from '@shared/ui-molecules';
import { AppLanguage, LanguageService } from '../i18n/language.service';

const LANGUAGE_OPTIONS: readonly UiSegmentedOption<AppLanguage>[] = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
  { value: 'ar', label: 'ع' },
];

@Component({
  selector: 'app-language-switch',
  imports: [ReactiveFormsModule, TranslatePipe, UiSegmentedControl],
  templateUrl: './language-switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitch {
  private readonly languages = inject(LanguageService);
  protected readonly options = LANGUAGE_OPTIONS;
  protected readonly choice = new FormControl<AppLanguage>(this.languages.language(), { nonNullable: true });

  constructor() {
    const subscription = this.choice.valueChanges.subscribe((language) => this.languages.use(language));
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    effect(() => this.choice.setValue(this.languages.language(), { emitEvent: false }));
  }
}
