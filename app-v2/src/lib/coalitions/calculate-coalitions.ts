import type { SeatResult } from '../../models/calculation-results.ts'
import type { CoalitionResult } from './types.ts'

export function calculateMinimalWinningCoalitions(
  seatResults: readonly SeatResult[],
  threshold: number,
): CoalitionResult[] {
  if (threshold <= 0 || seatResults.length === 0) {
    return []
  }
  if (!Number.isFinite(threshold)) {
    throw new RangeError('The coalition threshold must be finite.')
  }

  const sortedSeats = seatResults
    .map((result, inputIndex) => ({ result, inputIndex }))
    .sort(
      (left, right) =>
        right.result.seats - left.result.seats ||
        left.inputIndex - right.inputIndex,
    )
    .map(({ result }) => result)

  for (const result of sortedSeats) {
    if (!Number.isFinite(result.seats) || result.seats < 0) {
      throw new RangeError(
        `Seats for ${result.partyAbbreviation} must be finite and non-negative.`,
      )
    }
  }

  const coalitions: CoalitionResult[] = []

  function findCoalitions(
    members: readonly SeatResult[],
    remaining: readonly SeatResult[],
    seats: number,
  ): void {
    if (seats >= threshold) {
      coalitions.push({
        members,
        seats,
        threshold,
        surplus: seats - threshold,
      })
      return
    }

    for (let index = 0; index < remaining.length; index += 1) {
      const nextMember = remaining[index]
      if (!nextMember) {
        continue
      }

      findCoalitions(
        [...members, nextMember],
        remaining.slice(index + 1),
        seats + nextMember.seats,
      )
    }
  }

  findCoalitions([], sortedSeats, 0)
  return coalitions
}
