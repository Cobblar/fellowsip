/**
 * Decodes common HTML entities in a string.
 */
export function decodeHtmlEntities(text: string): string {
    if (!text) return text;

    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
        '&lsquo;': '‘',
        '&rsquo;': '’',
        '&ldquo;': '“',
        '&rdquo;': '”',
        '&bull;': '•',
        '&hellip;': '…',
        '&middot;': '·',
        '&deg;': '°',
        '&plusmn;': '±',
        '&laquo;': '«',
        '&raquo;': '»',
        '&iquest;': '¿',
        '&iexcl;': '¡',
        '&euro;': '€',
        '&pound;': '£',
        '&yen;': '¥',
    };

    return text
        .replace(/&[a-z0-9]+;/gi, (match) => entities[match.toLowerCase()] || match)
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([a-f0-9]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
