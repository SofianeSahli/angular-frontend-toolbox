import { FormlyExtension, FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

export class TranslateExtension implements FormlyExtension {
  constructor(private readonly translate: TranslateService) {}
  prePopulate(field: FormlyFieldConfig) {
    const props = field.props ?? {};
    if (!props['translated'] || props['translated']) {
      return;
    }
    props['translated'] = true;
    field.expressions = {
      ...(field.expressions ?? {}),
      'props.label': this.translate.stream(props.label ?? ''),
      'props.placeholder': this.translate.stream(props.placeholder ?? ''),
    };
  }
}

export function registerTranslateExtension(translate: TranslateService) {
  return {
    validationMessages: [
      {
        name: 'required',
        message: () => translate.stream('validation.required'),
      },
      {
        name: 'regex-validator',
        message: () => translate.stream('validation.regex'),
      },
      {
        name: 'invalid-username',
        message: () => translate.stream('validation.invalid-username'),
      },
    ],
    extensions: [
      {
        name: 'translate',
        extension: new TranslateExtension(translate),
      },
    ],
  };
}
