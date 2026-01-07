export interface SummaryModel {
  start_date: string;
  end_date: string;
  number_of_entries: number;
  number_income_entries: number;
  number_savings_entries: number;
  number_expenses_entries: number;
  total_income_amount: number;
  total_expenses_amount: number;
  total_saved_amount: number;
  daily_income: { [date: string]: number },
  daily_expenses: { [date: string]: number },
  daily_savings: { [date: string]: number }
}
