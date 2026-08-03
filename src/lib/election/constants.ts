import type { PartyQualificationRules } from './types.ts'

export const DEFAULT_PARLIAMENT_SEATS = 630
export const UNKNOWN_SEAT_POSITION = 999

export const DEFAULT_PARTY_QUALIFICATION_RULES = {
  voteShareThreshold: 0.05,
  minimumDirectMandates: 3,
  thresholdExemptParties: ['SSW'],
  excludedParties: ['Sonstige'],
} as const satisfies PartyQualificationRules
