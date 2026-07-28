/**
 * Compatibility contracts for JSON imported from the legacy `src/data` folder.
 *
 * The field names and literal values in this file are part of the persisted data
 * contract. Do not change them without migrating the corresponding JSON files
 * and updating the loaders that consume them.
 *
 * Legacy model source: `src/types/ElectionTypes.tsx`.
 */

export type Gender = 'm' | 'w'

export type AgeGroup =
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-54'
  | '55-64'
  | '65+'

export type VoteType = '1' | '2'

export type ElectionMethod = 'postal' | 'in-person'

/**
 * One party record from `src/data/partyData.json`.
 * `seatPosition` ranges from -100 (left) to 100 (right).
 */
export interface Party {
  name: string
  color: string
  abbreviation: string
  seatPosition: number
}

/**
 * One raw direct-mandate record from
 * `src/data/election_results_direktmandate.json`.
 *
 * The snake_case `districts_won` field is intentional. Mapping it to the legacy
 * application-facing `districtsWon` field belongs in a loader or adapter.
 */
export interface DirectMandateWinnerJson {
  party: string
  districts_won: number
}

/** One vote record from `src/data/second_votes.json`. */
export interface VoteEntry {
  state: string
  gender: Gender
  ageGroup: AgeGroup
  /** Party abbreviation, not the full party name. */
  party: string
  voteType: VoteType
  electionMethod: ElectionMethod
  votes: number
}

/** One demographic reference record from `src/data/stat_votes.json`. */
export interface StatVotes {
  gender: Gender
  ageGroup: AgeGroup
  party: string
  votes: number
}
