export type CategoryType = 'expense' | 'income' | 'saving';

export interface Leaf {
  readonly code: string;
  readonly key: string;
  readonly emoji: string | null;
  readonly retired: boolean;
  readonly isOther: boolean;
}

export interface Group {
  readonly code: string;
  readonly key: string;
  readonly emoji: string;
  readonly retired: boolean;
  readonly leaves: readonly Leaf[];
}

export interface Top {
  readonly code: string;
  readonly key: string;
  readonly emoji: string;
  readonly type: CategoryType;
  readonly retired: boolean;
  readonly groups: readonly Group[];
}

export interface CategoryNode {
  readonly code: string;
  readonly key: string;
  readonly level: 'top' | 'group' | 'leaf';
  readonly type: CategoryType;
  readonly emoji: string;
  readonly retired: boolean;
  readonly isOther: boolean;
  readonly top: Top;
  readonly group: Group | null;
  readonly leaf: Leaf | null;
}

export interface CategoryTree {
  readonly tops: readonly Top[];
  readonly etag: string | null;
}

export interface LeafDto {
  readonly code: string;
  readonly translation_key: string;
  readonly emoji: string | null;
  readonly retired: boolean;
  readonly is_other: boolean;
}

export interface GroupDto {
  readonly code: string;
  readonly translation_key: string;
  readonly emoji: string;
  readonly retired: boolean;
  readonly leaves: readonly LeafDto[];
}

export interface TopDto {
  readonly code: string;
  readonly translation_key: string;
  readonly emoji: string;
  readonly type: CategoryType;
  readonly retired: boolean;
  readonly groups: readonly GroupDto[];
}
