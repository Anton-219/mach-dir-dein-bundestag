/**
 * Application-calculated result models.
 *
 * These types are intentionally separate from the JSON compatibility contracts
 * in `json-contracts.ts`; they are not direct representations of restored data.
 * Legacy model source: `src/types/ElectionTypes.tsx`.
 */

/** The calculated election result for one party. */
export interface ElectionResult {
  partyAbbreviation: string
  votes: number
  percentage: number
  seatPosition: number
}

/** The calculated seat allocation for one party. */
export interface SeatResult {
  partyAbbreviation: string
  seats: number
  seatPosition: number
}
