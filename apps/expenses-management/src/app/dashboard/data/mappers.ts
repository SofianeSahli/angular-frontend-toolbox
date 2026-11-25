import { HttpParams } from '@angular/common/http';
import { DayTotals, DayTotalsDto, MemberTotals, MemberTotalsDto, MonthTotals, MonthTotalsDto, Summary, SummaryDto, SummaryNode, SummaryNodeDto, SummaryPeriod, Totals } from './models';

function toTotals(dto: Totals): Totals {
  return { income: dto.income, expense: dto.expense, saving: dto.saving, balance: dto.balance, entries: dto.entries };
}

function toNode(dto: SummaryNodeDto): SummaryNode {
  return { category: dto.category, type: dto.type, total: dto.total, entries: dto.entries, children: dto.children.map(toNode) };
}

function toMember(dto: MemberTotalsDto): MemberTotals {
  return { ...toTotals(dto), account: { id: dto.account.id, name: dto.account.name } };
}

function toDay(dto: DayTotalsDto): DayTotals {
  return { date: dto.date, ...toTotals(dto) };
}

function toMonth(dto: MonthTotalsDto): MonthTotals {
  return { month: dto.month, ...toTotals(dto) };
}

export function toSummary(dto: SummaryDto): Summary {
  return {
    from: dto.from,
    to: dto.to,
    currency: dto.currency,
    totals: toTotals(dto.totals),
    categories: dto.categories.map(toNode),
    members: dto.members.map(toMember),
    days: (dto.days ?? []).map(toDay),
    months: (dto.months ?? []).map(toMonth),
  };
}

export function toPeriodParams(period: SummaryPeriod): HttpParams {
  return 'month' in period ? new HttpParams().set('month', period.month) : new HttpParams().set('from', period.from).set('to', period.to);
}
