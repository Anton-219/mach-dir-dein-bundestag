/**
 * Compatibility contracts for JSON imported from `public/data`.
 *
 * The field names and literal values in this file are part of the persisted data
 * contract. Do not change them without migrating the corresponding JSON files
 * and updating the loaders that consume them.
 */

export type Gender = 'm' | 'w'

export type AgeGroup =
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-59'
  | '60-69'
  | '70+'

export type VoteType = '1' | '2'

export type ElectionMethod = 'postal' | 'in-person'

/**
 * One party record from `public/data/partyData.json`.
 * `seatPosition` ranges from -100 (left) to 100 (right).
 */
export interface Party {
  name: string
  color: string
  abbreviation: string
  seatPosition: number
}

/** One constituency-aware record from a prepared vote-entry JSON file. */
export interface VoteEntry {
  districtId: number
  state: string
  gender: Gender
  ageGroup: AgeGroup
  /** Party abbreviation, not the full party name. */
  party: string
  voteType: VoteType
  electionMethod: ElectionMethod
  votes: number
}

/** One demographic reference record from `public/data/stat_votes.json`. */
export interface StatVotes {
  gender: Gender
  ageGroup: AgeGroup
  party: string
  votes: number
}
