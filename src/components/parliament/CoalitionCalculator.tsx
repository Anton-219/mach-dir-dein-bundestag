import { useMemo } from 'react';
import {SeatResult} from "../../types/ElectionTypes.tsx";

/**
 * @deprecated The typed, UI-independent replacement lives in
 * `app-v2/src/lib/coalitions/calculate-coalitions.ts`.
 */
export function findAllCombinations(
    seats: SeatResult[],
    threshold: number
): SeatResult[][] {
    const sorted = [...seats].sort((a, b) => b.seats - a.seats);
    const results: SeatResult[][] = [];

    const _find = (current: SeatResult[], remaining: SeatResult[]) => {
        const currentSum = current.reduce((sum, sr) => sum + sr.seats, 0);

        if (currentSum >= threshold) {
            results.push(current);
            return;
        }

        for (let j = 0; j < remaining.length; j++) {
            const nextElement = remaining[j];
            const newCurrent = [...current, nextElement];
            const newRemaining = remaining.slice(j + 1);
            _find(newCurrent, newRemaining);
        }
    };

    _find([], sorted);
    return results;
}
export function useCoalitionCalculator(seatResults: SeatResult[], threshold: number) {
    return useMemo(() => {
        console.log("Received seatResults", seatResults);
        if (threshold <= 0 || seatResults.length === 0) return [];
        return findAllCombinations(seatResults, threshold);
    }, [seatResults, threshold]);
}
