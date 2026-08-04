import type {
  ElectionResult,
  SeatResult,
} from '../../models/calculation-results.ts'
import { allocateSainteLague } from './allocate-sainte-lague.ts'
import { DEFAULT_PARLIAMENT_SEATS } from './constants.ts'
import { filterEligibleParties } from './qualify-parties.ts'
import type {
  DirectMandateCount,
  SeatAllocationOptions,
} from './types.ts'

export function allocateSeats(
  electionResults: readonly ElectionResult[],
  directMandates: readonly DirectMandateCount[],
  options: SeatAllocationOptions = {},
): SeatResult[] {
  const totalSeats = options.totalSeats ?? DEFAULT_PARLIAMENT_SEATS
  if (!Number.isInteger(totalSeats) || totalSeats < 0) {
    throw new RangeError('The total seat count must be a non-negative integer.')
  }

  const eligibleResults = filterEligibleParties(
    electionResults,
    directMandates,
    options.qualificationRules,
  )

  if (totalSeats === 0 || eligibleResults.length === 0) {
    return eligibleResults.map((result) => ({
      partyAbbreviation: result.partyAbbreviation,
      seats: 0,
      seatPosition: result.seatPosition,
    }))
  }

  const allocation = allocateSainteLague(
    eligibleResults.map((result) => ({
      key: result.partyAbbreviation,
      votes: result.votes,
    })),
    totalSeats,
  )
  const seatsByParty = new Map(
    allocation.allocations.map((result) => [result.key, result.seats]),
  )

  return eligibleResults.map((result) => ({
    partyAbbreviation: result.partyAbbreviation,
    seats: seatsByParty.get(result.partyAbbreviation) ?? 0,
    seatPosition: result.seatPosition,
  }))
}
