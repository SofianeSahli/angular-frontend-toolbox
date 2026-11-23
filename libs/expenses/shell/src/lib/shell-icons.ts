import { UiIconDefinition } from '@shared/ui-atoms';

export const SHELL_ICONS: Readonly<Record<string, UiIconDefinition>> = {
  user: {
    nodes: [
      ['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '12', cy: '7', r: '4' }],
    ],
  },
  'log-out': {
    nodes: [
      ['path', { d: 'm16 17 5-5-5-5' }],
      ['path', { d: 'M21 12H9' }],
      ['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }],
    ],
    directional: true,
  },
};
