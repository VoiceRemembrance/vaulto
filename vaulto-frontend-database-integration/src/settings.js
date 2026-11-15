import { PiggyBank, ShieldCheck, ShoppingBag, TrendingUp } from 'lucide-react';

export const DEFAULT_SETTINGS = {
  expense_percentage: 5,
  savings_percentage: 25,
  investment_percentage: 25,
  emergency_percentage: 45,
  expense_name: 'Guilt-free Expense',
  savings_name: 'Savings',
  investment_name: 'Investments',
  emergency_name: 'Emergency Fund',
};

const CATEGORY_DEFINITIONS = [
  { id: 'expense', tint: 'peach', color: '#0F766E', Icon: ShoppingBag },
  { id: 'savings', tint: 'mint', color: '#2ECC71', Icon: PiggyBank },
  { id: 'investment', tint: 'lavender', color: '#98F5C0', Icon: TrendingUp },
  { id: 'emergency', tint: 'gold', color: '#B6FF5C', Icon: ShieldCheck },
];

export function getBuckets(settings) {
  return CATEGORY_DEFINITIONS.map(({ id, ...category }) => ({
    ...category,
    id,
    name: settings[`${id}_name`],
    pct: Number(settings[`${id}_percentage`]),
  }));
}
