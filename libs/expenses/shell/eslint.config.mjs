import nx from '@nx/eslint-plugin';
import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'expenses', style: 'camelCase' }],
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'expenses', style: 'kebab-case' },
          { type: 'attribute', prefix: 'expenses', style: 'camelCase' },
        ],
      ],
    },
  },
];
