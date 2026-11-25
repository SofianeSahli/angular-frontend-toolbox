import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { CategoriesStore } from './categories.store';
import { CategoryNode } from './models';

export const UNKNOWN_EMOJI = '📝';
export const PATH_SEPARATOR = ' › ';

export interface SearchOptions {
  readonly branches: boolean;
  readonly retired: boolean;
}

export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();
}

@Injectable({ providedIn: 'root' })
export class CategoryLabels {
  private readonly translate = inject(TranslateService);
  private readonly store = inject(CategoriesStore);
  private readonly revision = injectTranslationRevision();

  name(code: string): string {
    const node = this.store.node(code);
    if (node === null) return this.translated('categories.unknown') ?? code;
    const keys = node.level === 'leaf' ? [node.key, node.group?.key, node.top.key] : node.level === 'group' ? [node.key, node.top.key] : [node.key];
    for (const key of keys) {
      const text = key === undefined ? null : this.translated(key);
      if (text !== null) return text;
    }
    return this.translated('categories.unknown') ?? code;
  }

  emoji(code: string): string {
    return this.store.node(code)?.emoji ?? UNKNOWN_EMOJI;
  }

  path(code: string): string {
    const node = this.store.node(code);
    if (node === null || node.level === 'top') return this.name(code);
    const parent = node.level === 'leaf' && node.group !== null ? node.group.code : node.top.code;
    return `${this.name(parent)}${PATH_SEPARATOR}${this.name(code)}`;
  }

  search(text: string, options: SearchOptions): readonly CategoryNode[] {
    const query = normalizeForSearch(text);
    if (query === '') return [];
    const matches = (code: string) => normalizeForSearch(this.name(code)).includes(query);
    const results: CategoryNode[] = [];
    const add = (code: string) => {
      const node = this.store.node(code);
      if (node !== null && (options.retired || !node.retired)) results.push(node);
    };
    for (const top of this.store.orderedTops()) {
      const topMatches = matches(top.code);
      if (options.branches && topMatches) add(top.code);
      for (const group of top.groups) {
        const groupMatches = matches(group.code);
        if (options.branches && groupMatches) add(group.code);
        for (const leaf of group.leaves) {
          if (topMatches || groupMatches || matches(leaf.code)) add(leaf.code);
        }
      }
    }
    return results;
  }

  private translated(key: string): string | null {
    this.revision();
    const text: unknown = this.translate.instant(key);
    return typeof text === 'string' && text !== '' && text !== key ? text : null;
  }
}
