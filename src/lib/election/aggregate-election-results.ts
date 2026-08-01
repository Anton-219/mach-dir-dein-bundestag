import type { ElectionResult } from '../../models/calculation-results.ts'
import type { Party, VoteEntry } from '../../models/json-contracts.ts'
import { UNKNOWN_SEAT_POSITION } from './constants.ts'

export function aggregateElectionResults(
  voteEntries: readonly VoteEntry[],
  parties: readonly Party[],
): ElectionResult[] {
  const partiesByAbbreviation = new Map(
    parties.map((party) => [party.abbreviation, party]),
  )
  const resultsByParty = new Map<string, ElectionResult>()
  let totalVotes = 0

  for (const entry of voteEntries) {
    if (!Number.isFinite(entry.votes) || entry.votes < 0) {
      throw new RangeError(
        `Votes for ${entry.party} must be a finite, non-negative number.`,
      )
    }

    totalVotes += entry.votes
    const existingResult = resultsByParty.get(entry.party)

    if (existingResult) {
      existingResult.votes += entry.votes
      continue
    }

    resultsByParty.set(entry.party, {
      partyAbbreviation: entry.party,
      votes: entry.votes,
      percentage: 0,
      seatPosition:
        partiesByAbbreviation.get(entry.party)?.seatPosition ??
        UNKNOWN_SEAT_POSITION,
    })
  }

  if (totalVotes > 0) {
    for (const result of resultsByParty.values()) {
      result.percentage = result.votes / totalVotes
    }
  }

  return [...resultsByParty.values()]
}
