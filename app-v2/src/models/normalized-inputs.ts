/**
 * Application-facing input models created from the restored JSON contracts.
 *
 * Loaders and adapters may normalize JSON field names into these shapes, but
 * must not alter the source data contracts in `json-contracts.ts`.
 * Legacy model source: `src/types/ElectionTypes.tsx`.
 */

/** Direct-mandate totals after adapting the raw `districts_won` field. */
export interface DirectMandateWinner {
  party: string
  districtsWon: number
}
