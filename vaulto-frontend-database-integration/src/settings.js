import { PiggyBank, ShoppingBag } from 'lucide-react';

export const DEFAULT_SETTINGS = { categories: [] };

const PALETTE = [
  { tint: 'peach', color: '#f28b70' },
  { tint: 'mint', color: '#56b9a6' },
  { tint: 'lavender', color: '#8b82e8' },
  { tint: 'gold', color: '#d9a743' },
];

export function normalizeSettings(settings = DEFAULT_SETTINGS) {
  return { categories: Array.isArray(settings.categories) ? settings.categories : [] };
}

export function getBuckets(settings) {
  const categories = normalizeSettings(settings).categories.filter(item => item.active !== false);
  return categories.map((category, index) => {
    const palette = PALETTE[index % PALETTE.length];
    return {
      ...palette,
      Icon: category.category_type === 'contribution' ? PiggyBank : ShoppingBag,
      id: category.id,
      name: category.name,
      type: category.category_type || 'expense',
      pct: Number(category.percentage ?? 0),
    };
  });
}
