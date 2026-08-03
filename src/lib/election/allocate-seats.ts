import type {
  ElectionResult,
  SeatResult,
} from '../../models/calculation-results.ts'
import { DEFAULT_PARLIAMENT_SEATS } from './constants.ts'
import { filterEligibleParties } from './qualify-parties.ts'
import type {
  DirectMandateCount,
  SeatAllocationOptions,
} from './types.ts'

interface Quotient {
  partyAbbreviation: string
  value: number
  partyIndex: number
  divisorIndex: number
}

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

  const quotients: Quotient[] = []
  eligibleResults.forEach((result, partyIndex) => {
    if (!Number.isFinite(result.votes) || result.votes < 0) {
      throw new RangeError(
        `Votes for ${result.partyAbbreviation} must be finite and non-negative.`,
      )
    }

    for (let divisorIndex = 0; divisorIndex < totalSeats; divisorIndex += 1) {
      quotients.push({
        partyAbbreviation: result.partyAbbreviation,
        value: result.votes / (2 * divisorIndex + 1),
        partyIndex,
        divisorIndex,
      })
    }
  })

  quotients.sort(
    (left, right) =>
      right.value - left.value ||
      left.partyIndex - right.partyIndex ||
      left.divisorIndex - right.divisorIndex,
  )

  const seatsByParty = new Map<string, number>()
  for (const quotient of quotients.slice(0, totalSeats)) {
    seatsByParty.set(
      quotient.partyAbbreviation,
      (seatsByParty.get(quotient.partyAbbreviation) ?? 0) + 1,
    )
  }

  return eligibleResults.map((result) => ({
    partyAbbreviation: result.partyAbbreviation,
    seats: seatsByParty.get(result.partyAbbreviation) ?? 0,
    seatPosition: result.seatPosition,
  }))
}
