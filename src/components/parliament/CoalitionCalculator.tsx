import { useMemo } from 'react';
import {SeatResult} from "../../types/ElectionTypes.tsx";

export function findAllCombinations(
    seats: SeatResult[],
    threshold: number
): SeatResult[][] {
    // Sort seats in descending order to prioritize larger groups first
    const sorted = [...seats].sort((a, b) => b.seats - a.seats);
    const results: SeatResult[][] = [];

    // Recursive helper to build combinations
    const _find = (current: SeatResult[], remaining: SeatResult[]) => {
        const currentSum = current.reduce((sum, sr) => sum + sr.seats, 0);

        // If current combination meets/exceeds threshold, add to results
        if (currentSum >= threshold) {
            results.push(current);
            return;
        }

        // Try adding each remaining element (avoid duplicates via slicing)
        for (let j = 0; j < remaining.length; j++) {
            const nextElement = remaining[j];
            const newCurrent = [...current, nextElement];
            const newRemaining = remaining.slice(j + 1); // Prevent duplicates and maintain order
            _find(newCurrent, newRemaining);
        }
    };

    _find([], sorted); // Start with empty combination and full sorted list
    return results;
}
export function useCoalitionCalculator(seatResults: SeatResult[], threshold: number) {
    return useMemo(() => {
        console.log("Received seatResults", seatResults);
        if (threshold <= 0 || seatResults.length === 0) return [];
        return findAllCombinations(seatResults, threshold);
    }, [seatResults, threshold]);
}