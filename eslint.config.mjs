import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          // docs/ARCHITECTURE.md §3, copied exactly (spec 001, REQ-3.3).
          depConstraints: [
            { sourceTag: 'scope:shared',   onlyDependOnLibsWithTags: ['scope:shared'] },
            { sourceTag: 'scope:expenses', onlyDependOnLibsWithTags: ['scope:expenses', 'scope:shared'] },

            { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature', 'type:data-access', 'type:ui', 'type:domain', 'type:util'] },
            { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:domain', 'type:util'] },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:domain', 'type:util'] },
            { sourceTag: 'type:domain',      onlyDependOnLibsWithTags: ['type:domain', 'type:util'] },
            { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
            { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'] },

            { sourceTag: 'layer:tokens',   onlyDependOnLibsWithTags: ['type:util'] },
            { sourceTag: 'layer:atom',     onlyDependOnLibsWithTags: ['layer:tokens', 'type:util'] },
            { sourceTag: 'layer:molecule', onlyDependOnLibsWithTags: ['layer:atom', 'layer:tokens', 'type:util'] },
            { sourceTag: 'layer:organism', onlyDependOnLibsWithTags: ['layer:molecule', 'layer:atom', 'layer:tokens', 'type:domain', 'type:util'] },
            { sourceTag: 'layer:template', onlyDependOnLibsWithTags: ['layer:organism', 'layer:molecule', 'layer:atom', 'layer:tokens', 'type:util'] },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
