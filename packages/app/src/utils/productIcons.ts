import { Wine, Grape, Beer, Coffee, Leaf, Cookie, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PRODUCT_ICONS: Record<string, LucideIcon> = {
    'Wine': Grape,
    'Whisky': Wine,
    'Beer': Beer,
    'Sake': Wine,
    'Coffee': Coffee,
    'Tea': Leaf,
    'Chocolate': Cookie,
    'Other': Package,
};

export function getProductIcon(productType: string | null | undefined): LucideIcon {
    if (!productType) return Wine;
    return PRODUCT_ICONS[productType] || Wine;
}

// Color classes for each product type
export const PRODUCT_COLORS: Record<string, string> = {
    'Wine': 'text-purple-500',
    'Whisky': 'text-amber-500',
    'Beer': 'text-yellow-500',
    'Sake': 'text-blue-300',
    'Coffee': 'text-amber-700',
    'Tea': 'text-green-500',
    'Chocolate': 'text-amber-800',
    'Other': 'text-[var(--text-secondary)]',
};

export function getProductColor(productType: string | null | undefined): string {
    if (!productType) return 'text-amber-500';
    return PRODUCT_COLORS[productType] || 'text-amber-500';
}
