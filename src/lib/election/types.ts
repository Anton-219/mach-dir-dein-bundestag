import type { VoteEntry } from '../../models/json-contracts.ts'

export interface VoteEntryFilter {
  id: string
  matches: (entry: VoteEntry) => boolean
}

export interface DirectMandateCount {
  party: string
  districtsWon: number
}

export interface DistrictPartyVoteTotal {
  districtId: number
  party: string
  votes: number
}

export type DistrictWinnerResolver = (
  results: readonly DistrictPartyVoteTotal[],
) => string | undefined

export interface PartyQualificationRules {
  voteShareThreshold: number
  minimumDirectMandates: number
  thresholdExemptParties: readonly string[]
  excludedParties: readonly string[]
}

export interface SeatAllocationOptions {
  totalSeats?: number
  qualificationRules?: PartyQualificationRules
}
