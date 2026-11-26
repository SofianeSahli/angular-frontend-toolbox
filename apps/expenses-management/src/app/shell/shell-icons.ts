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
  wallet: {
    nodes: [
      ['path', { d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' }],
      ['path', { d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' }],
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
  'chart-column': {
    nodes: [
      ['path', { d: 'M3 3v16a2 2 0 0 0 2 2h16' }],
      ['path', { d: 'M18 17V9' }],
      ['path', { d: 'M13 17V5' }],
      ['path', { d: 'M8 17v-3' }],
    ],
  },
  sun: {
    nodes: [
      ['circle', { cx: '12', cy: '12', r: '4' }],
      ['path', { d: 'M12 2v2' }],
      ['path', { d: 'M12 20v2' }],
      ['path', { d: 'm4.93 4.93 1.41 1.41' }],
      ['path', { d: 'm17.66 17.66 1.41 1.41' }],
      ['path', { d: 'M2 12h2' }],
      ['path', { d: 'M20 12h2' }],
      ['path', { d: 'm6.34 17.66-1.41 1.41' }],
      ['path', { d: 'm19.07 4.93-1.41 1.41' }],
    ],
  },
  moon: {
    nodes: [['path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }]],
  },
  monitor: {
    nodes: [
      ['rect', { width: '20', height: '14', x: '2', y: '3', rx: '2' }],
      ['path', { d: 'M8 21h8' }],
      ['path', { d: 'M12 17v4' }],
    ],
  },
  'qr-code': {
    nodes: [
      ['rect', { width: '5', height: '5', x: '3', y: '3', rx: '1' }],
      ['rect', { width: '5', height: '5', x: '16', y: '3', rx: '1' }],
      ['rect', { width: '5', height: '5', x: '3', y: '16', rx: '1' }],
      ['path', { d: 'M21 16h-3a2 2 0 0 0-2 2v3' }],
      ['path', { d: 'M21 21v.01' }],
      ['path', { d: 'M12 7v3a2 2 0 0 1-2 2H7' }],
      ['path', { d: 'M3 12h.01' }],
      ['path', { d: 'M12 3h.01' }],
      ['path', { d: 'M12 16v.01' }],
      ['path', { d: 'M16 12h1' }],
      ['path', { d: 'M21 12v.01' }],
      ['path', { d: 'M12 21v-1' }],
    ],
  },
  mail: {
    nodes: [
      ['rect', { width: '20', height: '16', x: '2', y: '4', rx: '2' }],
      ['path', { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' }],
    ],
  },
};
