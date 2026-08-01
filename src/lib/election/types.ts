import type { VoteEntry } from '../../models/json-contracts.ts'

export interface VoteEntryFilter {
  id: string
  matches: (entry: VoteEntry) => boolean
}

export interface PartyQualificationRules {
  voteShareThreshold: number
  minimumDirectMandates: number
  minimumVotesByExemptParty: Readonly<Record<string, number>>
  excludedParties: readonly string[]
}

export interface SeatAllocationOptions {
  totalSeats?: number
  qualificationRules?: PartyQualificationRules
}
