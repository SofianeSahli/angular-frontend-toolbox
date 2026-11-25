import { UiIconDefinition } from '@shared/ui-atoms';

export const SHELL_ICONS: Readonly<Record<string, UiIconDefinition>> = {
  user: {
    nodes: [
      ['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '12', cy: '7', r: '4' }],
    ],
  },
  users: {
    nodes: [
      ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '9', cy: '7', r: '4' }],
      ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
      ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
    ],
  },
  list: {
    nodes: [
      ['path', { d: 'M3 6h.01' }],
      ['path', { d: 'M3 12h.01' }],
      ['path', { d: 'M3 18h.01' }],
      ['path', { d: 'M8 6h13' }],
      ['path', { d: 'M8 12h13' }],
      ['path', { d: 'M8 18h13' }],
    ],
  },
  'chevron-down': {
    nodes: [['path', { d: 'm6 9 6 6 6-6' }]],
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
