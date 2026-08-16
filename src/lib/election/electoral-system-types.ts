import type { PartyQualificationRules } from './types.ts'

export const ELECTORAL_SYSTEM_IDS = [
  'de-2021-bwahlg',
  'de-2023-fixed-630',
  'union-parallel',
] as const

export type ElectoralSystemId = (typeof ELECTORAL_SYSTEM_IDS)[number]
export type ElectoralScenarioMode = 'unfiltered-reference' | 'filtered-model'

export interface ElectoralScenarioParty {
  secondVotes: number
  isNationalMinorityParty: boolean
}

export interface ElectoralScenarioState {
  state: string
  isActive: boolean
  validFirstVotes: number
  validSecondVotes: number
  secondVotesByParty: Readonly<Record<string, number>>
}

export interface ElectoralScenarioDistrict {
  districtId: number
  state: string
  validFirstVotes: number
  firstVotesByParty: Readonly<Record<string, number>>
}

export interface ElectoralScenario {
  mode: ElectoralScenarioMode
  validSecondVotes: number
  parties: Readonly<Record<string, ElectoralScenarioParty>>
  states: readonly ElectoralScenarioState[]
  districts: readonly ElectoralScenarioDistrict[]
}

export type ElectoralSystemErrorCode =
  | 'UNSUPPORTED_INDEPENDENT_WINNER'
  | 'MISSING_STATE_SEAT_CONTINGENT'
  | 'INVALID_STATE_SEAT_CONTINGENT_FIXTURE'
  | 'UNSATISFIABLE_SEAT_MINIMUM'
  | 'INCONSISTENT_STATE_ACTIVITY'
  | 'INCONSISTENT_DIRECT_TIER_SIZE'
  | 'NO_VALID_SECOND_VOTES'

export type ElectoralSystemWarningCode =
  | 'FILTERED_FIRST_VOTE_MODEL'
  | 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER'
  | 'DISTRICT_TIE_REPLACED_BY_STABLE_ORDER'
  | 'INACTIVE_STATE_SIMULATION'

export type CalculationDetails = Record<string, string | number | string[]>

export interface ElectoralSystemError {
  code: ElectoralSystemErrorCode
  details?: CalculationDetails
}

export interface ElectoralSystemWarning {
  code: ElectoralSystemWarningCode
  details?: CalculationDetails
}

export class ElectoralSystemCalculationError extends Error {
  readonly code: ElectoralSystemErrorCode
  readonly details?: CalculationDetails

  constructor(
    code: ElectoralSystemErrorCode,
    message: string,
    details?: CalculationDetails,
  ) {
    super(message)
    this.name = 'ElectoralSystemCalculationError'
    this.code = code
    this.details = details
  }
}

export interface DistrictWinner {
  districtId: number
  state: string
  party: string
  firstVotes: number
  validFirstVotes: number
  firstVoteShare: number
}

export interface DistrictWinnerResolution {
  winners: readonly DistrictWinner[]
  directWinsByParty: Readonly<Record<string, number>>
  allocatedDistrictCount: number
  emptyDistrictCount: number
  warnings: readonly ElectoralSystemWarning[]
}

export interface ElectoralSystemPartyResult {
  party: string
  secondVotes: number
  eligibleForListSeats: boolean
  totalSeats: number
  directWins: number
  directSeats: number
  listSeats: number
  uncoveredDistrictWins: number
}

export interface ElectoralSystemMetadata {
  institutionalSeatCapacity: number
  allocatedDirectSeatCount: number
  emptyDistrictCount: number
  fixedListSeatCount?: number
  maximumDirectSeatCount?: number
  unallocatedDirectSeatCount?: number
  reservedDirectSeats: number
  uncompensatedOverhangSeats: number
  inactiveStates: string[]
  stateSeatContingentYear?: number
  referenceScenario?: 'btw-2021-main-election' | 'btw-2025-main-election'
}

export interface ElectoralSystemResult {
  systemId: ElectoralSystemId
  legalVersion: string
  scenarioMode: ElectoralScenarioMode
  totalSeats: number
  majorityThreshold: number
  parties: readonly ElectoralSystemPartyResult[]
  warnings: readonly ElectoralSystemWarning[]
  metadata: ElectoralSystemMetadata
}

export interface ElectoralSystemSupportingData {
  nationalDirectMandates?: Readonly<Record<string, number>>
  stateDirectMandates?: Readonly<Record<string, Readonly<Record<string, number>>>>
  stateSeatContingents?: Readonly<Record<string, number>>
  stateSeatContingentYear?: number
}

export interface ElectoralSystemCalculationInput {
  scenario: ElectoralScenario
  districtWinners: readonly DistrictWinner[]
  directWinsByParty: Readonly<Record<string, number>>
  qualificationRules?: PartyQualificationRules
  supportingData?: ElectoralSystemSupportingData
}

export interface ElectoralSystemCalculator {
  readonly systemId: ElectoralSystemId
  readonly legalVersion: string
  calculate: (input: ElectoralSystemCalculationInput) => ElectoralSystemResult
}
