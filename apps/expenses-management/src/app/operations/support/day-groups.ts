import { UiListGroup } from '@shared/ui-organisms';
import { addDays } from '@shared/util-format';
import { Entry } from '../data/models';

export interface DayLabels {
  readonly today: string;
  readonly yesterday: string;
  readonly locale: string;
}

const UI_LOCALES: Readonly<Record<string, string>> = {
  fr: 'fr-TN',
  en: 'en-GB',
  ar: 'ar-TN',
};

export function uiLocale(language: string | undefined): string {
  return UI_LOCALES[language ?? 'fr'] ?? UI_LOCALES['fr'];
}

export function longDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function dayLabel(iso: string, today: string, labels: DayLabels): string {
  if (iso === today) return labels.today;
  if (iso === addDays(today, -1)) return labels.yesterday;
  return longDate(iso, labels.locale);
}

export function dayGroups(entries: readonly Entry[], today: string, labels: DayLabels): UiListGroup<Entry>[] {
  const groups: { key: string; label: string; items: Entry[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last?.key === entry.date) last.items.push(entry);
    else
      groups.push({
        key: entry.date,
        label: dayLabel(entry.date, today, labels),
        items: [entry],
      });
  }
  return groups;
}
