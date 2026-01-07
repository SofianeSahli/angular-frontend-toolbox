import { FormlyFieldConfig } from '@ngx-formly/core';
import { EMAIL_REGEX, regexValidator } from '@shared/ui-components';

export const PROFILE_FORM: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        key: 'first_name',
        type: 'input',
        className: 'col-12 col-md-6',
        props: {
          label: 'labels.first_name',
          type: 'text',
          required: true,
          placeholder: 'placeholder.first_name',
        },
      },
      {
        key: 'last_name',
        type: 'input',
        className: 'col-12 col-md-6',
        props: {
          label: 'labels.last_name',
          type: 'text',
          required: true,
          placeholder: 'placeholder.last_name',
        },
      },
      {
        key: 'phone_number',
        type: 'input',
        className: 'col-12 col-md-6',
        props: {
          label: 'labels.phone_number',
          required: true,
          placeholder: 'placeholder.phone_number',
        },
      },
      {
        key: 'email',
        type: 'input',
        className: 'col-12 col-md-6',
        props: {
          label: 'labels.email',
          type: 'text',
          required: true,
          placeholder: 'placeholder.email',
        },
        validators: {
          validation: [regexValidator(EMAIL_REGEX, 'regex-validator')],
        },
      }
      
    ],
  },
];
