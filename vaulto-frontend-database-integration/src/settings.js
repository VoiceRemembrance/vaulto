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
  categories: [
    { id: 'expense', name: 'Guilt-free Expense', percentage: 5, active: true },
    { id: 'savings', name: 'Savings', percentage: 25, active: true },
    { id: 'investment', name: 'Investments', percentage: 25, active: true },
    { id: 'emergency', name: 'Emergency Fund', percentage: 45, active: true },
  ],
};

const CATEGORY_DEFINITIONS = [
  { id: 'expense', tint: 'peach', color: '#f28b70', Icon: ShoppingBag },
  { id: 'savings', tint: 'mint', color: '#56b9a6', Icon: PiggyBank },
  { id: 'investment', tint: 'lavender', color: '#8b82e8', Icon: TrendingUp },
  { id: 'emergency', tint: 'gold', color: '#d9a743', Icon: ShieldCheck },
];

export function normalizeSettings(settings = DEFAULT_SETTINGS) {
  const categories = Array.isArray(settings.categories) && settings.categories.length ? settings.categories : DEFAULT_SETTINGS.categories;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    categories,
  };
}

export function getBuckets(settings) {
  const normalized = normalizeSettings(settings);
  const categories = (normalized.categories || DEFAULT_SETTINGS.categories).filter(item => item.active !== false);
  return categories.map((category, index) => {
    const palette = CATEGORY_DEFINITIONS[index % CATEGORY_DEFINITIONS.length] || CATEGORY_DEFINITIONS[0];
    return {
      ...palette,
      id: category.id,
      name: category.name,
      pct: Number(category.percentage ?? 0),
    };
  });
}
