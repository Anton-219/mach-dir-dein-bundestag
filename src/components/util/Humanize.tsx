/**
 * Converts a big number (Value above 1 million) to a better readable value
 * @param value
 * @param locale
 */
export const humanizeNumber = (
    value: number,
    locale: 'en' | 'de' = 'en'
): string => {
    if (value < 1e3) {
        // For values less than 1,000 return the number directly.
        return value.toString();
    } else if (value < 1e6) {
        // For values in the thousands range, divide by 1,000.
        const result = value / 1e3;
        // Format to one decimal place and remove any trailing zeros.
        const formatted = parseFloat(result.toFixed(1)).toString();
        return locale === 'de'
            ? `${formatted} Tsd.`
            : `${formatted}k`;
    } else {
        // For values in the millions range, divide by 1,000,000.
        const result = value / 1e6;
        // Format to two decimal places and remove trailing zeros.
        const formatted = parseFloat(result.toFixed(2)).toString();
        return locale === 'de'
            ? `${formatted} Mio.`
            : `${formatted}M`;
    }
};
