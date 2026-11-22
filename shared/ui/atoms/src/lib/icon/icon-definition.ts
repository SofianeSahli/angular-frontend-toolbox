export type UiIconShape = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse';

export type UiIconNode = readonly [shape: UiIconShape, attributes: Readonly<Record<string, string>>];

export interface UiIconDefinition {
  readonly nodes: readonly UiIconNode[];
  readonly directional?: boolean;
}

export type UiIconSize = 16 | 20 | 24;
