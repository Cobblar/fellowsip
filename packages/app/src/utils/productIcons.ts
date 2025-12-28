// Product type emoji icons
export const PRODUCT_ICONS: Record<string, string> = {
    'Wine': '🍷',
    'Whisky': '🥃',
    'Beer': '🍺',
    'Sake': '🍶',
    'Coffee': '☕',
    'Tea': '🍵',
    'Chocolate': '🍫',
    'Cheese': '🧀',
    'Other': '✨',
};

export function getProductIcon(productType: string | null | undefined): string {
    if (!productType) return '🥃';
    return PRODUCT_ICONS[productType] || '🥃';
}

// Color classes for each product type (for background accents, not emoji coloring)
export const PRODUCT_COLORS: Record<string, string> = {
    'Wine': 'text-purple-500',
    'Whisky': 'text-amber-500',
    'Beer': 'text-yellow-500',
    'Sake': 'text-blue-300',
    'Coffee': 'text-amber-700',
    'Tea': 'text-green-500',
    'Chocolate': 'text-amber-800',
    'Cheese': 'text-yellow-600',
    'Other': 'text-[var(--text-secondary)]',
};

export function getProductColor(productType: string | null | undefined): string {
    if (!productType) return 'text-amber-500';
    return PRODUCT_COLORS[productType] || 'text-amber-500';
}
