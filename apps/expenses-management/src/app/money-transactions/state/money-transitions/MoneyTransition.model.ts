import { BaseModel, GeneralQuery } from '@shared/stores';
import { Categorie } from 'apps/expenses-management/src/models/Categorie.model';

export interface MoneyTransition extends BaseModel {
  amount: string;
  description: string;
  categorie: Categorie;
  date: string,
  batch_id: string
  occurence: string
}

export interface MoneyTransitionQuery extends GeneralQuery {
  min_amount: number;
  max_amount: number;
  categories: Array<string>
  start_date: string
  end_date: string

}
