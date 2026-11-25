import { toTop } from './data/mappers';
import { Top, TopDto } from './data/models';

export const TREE_DTO: readonly TopDto[] = [
  {
    code: 'salary',
    translation_key: 'categories.salary.label',
    emoji: '💼',
    type: 'income',
    retired: false,
    groups: [
      {
        code: 'salary.pay',
        translation_key: 'categories.salary.pay.label',
        emoji: '💵',
        retired: false,
        leaves: [
          {
            code: 'salary.pay.monthly',
            translation_key: 'categories.salary.pay.monthly.label',
            emoji: '🗓️',
            retired: false,
            is_other: false,
          },
        ],
      },
    ],
  },
  {
    code: 'food',
    translation_key: 'categories.food.label',
    emoji: '🛒',
    type: 'expense',
    retired: false,
    groups: [
      {
        code: 'food.groceries',
        translation_key: 'categories.food.groceries.label',
        emoji: '🏪',
        retired: false,
        leaves: [
          {
            code: 'food.groceries.supermarket',
            translation_key: 'categories.food.groceries.supermarket.label',
            emoji: '🥫',
            retired: false,
            is_other: false,
          },
          {
            code: 'food.groceries.bakery',
            translation_key: 'categories.food.groceries.bakery.label',
            emoji: null,
            retired: false,
            is_other: false,
          },
          {
            code: 'food.groceries.old',
            translation_key: 'categories.food.groceries.old.label',
            emoji: '📦',
            retired: true,
            is_other: false,
          },
          {
            code: 'food.groceries.other',
            translation_key: 'categories.food.groceries.other.label',
            emoji: '📝',
            retired: false,
            is_other: true,
          },
        ],
      },
    ],
  },
  {
    code: 'savings',
    translation_key: 'categories.savings.label',
    emoji: '🐷',
    type: 'saving',
    retired: false,
    groups: [
      {
        code: 'savings.account',
        translation_key: 'categories.savings.account.label',
        emoji: '🏦',
        retired: false,
        leaves: [
          {
            code: 'savings.account.deposit',
            translation_key: 'categories.savings.account.deposit.label',
            emoji: '💰',
            retired: false,
            is_other: false,
          },
        ],
      },
    ],
  },
];

export const TREE: readonly Top[] = TREE_DTO.map(toTop);

export const LABELS = {
  categories: {
    unknown: 'Autre',
    salary: {
      label: 'Salaire',
      pay: { label: 'Paie', monthly: { label: 'Mensuel' } },
    },
    food: {
      label: 'Alimentation',
      groceries: {
        label: 'Courses',
        supermarket: { label: 'Supermarché' },
        bakery: { label: 'Boulangerie' },
        old: { label: 'Ancienne' },
        other: { label: 'Autre' },
      },
    },
    savings: { label: 'Épargne', account: { label: 'Compte épargne' } },
  },
};
