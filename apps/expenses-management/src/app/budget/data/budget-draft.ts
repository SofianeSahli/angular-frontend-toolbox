import { Signal, computed, signal } from '@angular/core';
import { ParseFailure, ParseResult, parseMajor } from '@shared/util-format';
import { overlaps } from '../../categories/data/overlap';
import { minorToMajorText } from '../../operations/data/entry-draft';
import { Budget, BudgetInput } from './models';

export interface DraftLine {
  readonly category: string;
  readonly text: string;
  readonly retired: boolean;
}

interface Snapshot {
  readonly lines: readonly DraftLine[];
  readonly income: string;
  readonly saving: string;
}

const EMPTY: Snapshot = { lines: [], income: '', saving: '' };

export { overlaps };

function parseOptional(text: string, exponent: number): ParseResult | null {
  return text.trim() === '' ? null : parseMajor(text, exponent, { allowZero: true });
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.income.trim() === b.income.trim() &&
    a.saving.trim() === b.saving.trim() &&
    a.lines.length === b.lines.length &&
    a.lines.every((line, index) => line.category === b.lines[index].category && line.text.trim() === b.lines[index].text.trim())
  );
}

export class BudgetDraft {
  private readonly baseline = signal<Snapshot>(EMPTY);
  private readonly state = signal<Snapshot>(EMPTY);

  readonly lines: Signal<readonly DraftLine[]> = computed(() => this.state().lines);
  readonly income: Signal<string> = computed(() => this.state().income);
  readonly saving: Signal<string> = computed(() => this.state().saving);
  readonly dirty = computed(() => !sameSnapshot(this.state(), this.baseline()));
  readonly categories = computed(() => new Set(this.lines().map((line) => line.category)));
  readonly isEmpty = computed(() => this.lines().length === 0 && this.income().trim() === '' && this.saving().trim() === '');

  readonly lineErrors = computed(() => {
    const errors = new Map<string, ParseFailure>();
    for (const line of this.lines()) {
      const parsed = parseMajor(line.text, this.exponent, { allowZero: true });
      if (!parsed.ok) errors.set(line.category, parsed.reason);
    }
    return errors;
  });

  readonly incomeError = computed(() => this.failureOf(this.income()));
  readonly savingError = computed(() => this.failureOf(this.saving()));

  readonly plannedTotal = computed(() =>
    this.lines().reduce((sum, line) => {
      const parsed = parseMajor(line.text, this.exponent, { allowZero: true });
      return parsed.ok ? sum + parsed.minor : sum;
    }, 0),
  );

  constructor(
    private readonly exponent: number,
    private readonly position: (code: string) => number,
  ) {}

  reset(budget: Budget | null): void {
    const snapshot: Snapshot =
      budget === null
        ? EMPTY
        : {
            lines: budget.lines.map((line) => ({ category: line.category, text: minorToMajorText(line.planned, this.exponent), retired: line.retired })),
            income: budget.income.expected === null ? '' : minorToMajorText(budget.income.expected, this.exponent),
            saving: budget.saving.planned === null ? '' : minorToMajorText(budget.saving.planned, this.exponent),
          };
    this.baseline.set(snapshot);
    this.state.set(snapshot);
  }

  canAdd(code: string): boolean {
    return !this.lines().some((line) => overlaps(line.category, code));
  }

  addLine(code: string, minor?: number): boolean {
    if (!this.canAdd(code)) return false;
    const text = minor === undefined ? '' : minorToMajorText(minor, this.exponent);
    const lines = [...this.lines(), { category: code, text, retired: false }];
    lines.sort((a, b) => this.position(a.category) - this.position(b.category));
    this.patch({ lines });
    return true;
  }

  removeLine(code: string): void {
    this.patch({ lines: this.lines().filter((line) => line.category !== code) });
  }

  setLine(code: string, text: string): void {
    this.patch({ lines: this.lines().map((line) => (line.category === code ? { ...line, text } : line)) });
  }

  setIncome(text: string): void {
    this.patch({ income: text });
  }

  setSaving(text: string): void {
    this.patch({ saving: text });
  }

  isValid(): boolean {
    return this.lineErrors().size === 0 && this.incomeError() === null && this.savingError() === null;
  }

  toInput(): BudgetInput | null {
    if (!this.isValid()) return null;
    const optional = (text: string): number | null => {
      const parsed = parseOptional(text, this.exponent);
      return parsed !== null && parsed.ok ? parsed.minor : null;
    };
    return {
      expectedIncome: optional(this.income()),
      plannedSaving: optional(this.saving()),
      lines: this.lines().map((line) => {
        const parsed = parseMajor(line.text, this.exponent, { allowZero: true });
        return { category: line.category, planned: parsed.ok ? parsed.minor : 0 };
      }),
    };
  }

  private failureOf(text: string): ParseFailure | null {
    const parsed = parseOptional(text, this.exponent);
    return parsed === null || parsed.ok ? null : parsed.reason;
  }

  private patch(partial: Partial<Snapshot>): void {
    this.state.set({ ...this.state(), ...partial });
  }
}
