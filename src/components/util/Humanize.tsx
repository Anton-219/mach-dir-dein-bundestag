/**
 * Converts a big number (Value above 1 million) to a better readable value
 * @param value
 */
export const humanizeNumber = (value: number): string => {
    if (value < 1e6) {
        return value.toString();
    }
    return `${(value/1e6).toFixed(2)} mio`;
}