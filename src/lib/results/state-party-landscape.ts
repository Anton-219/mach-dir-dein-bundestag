import type { FilterState } from '../filters/filter-state.ts'
import { aggregateElectionResults } from '../election/aggregate-election-results.ts'
import type { ElectionResult } from '../../models/calculation-results.ts'
import type { Party, VoteEntry } from '../../models/json-contracts.ts'

export type StatePartyLandscape =
  | {
      status: 'ready'
      results: ElectionResult[]
      votes: number
      shareOfVoters: number
    }
  | {
      status: 'invalid'
      results: []
      reason: 'calculationFailed'
    }

export function buildStatePartyLandscape(
  entries: readonly VoteEntry[],
  parties: readonly Party[],
  state: string,
  filters: FilterState,
): StatePartyLandscape {
  try {
    const demographicEntries = entries.filter(
      (entry) =>
        !filters.ageGroups.includes(entry.ageGroup) &&
        !filters.genders.includes(entry.gender) &&
        !filters.electionMethods.includes(entry.electionMethod),
    )
    const stateEntries = demographicEntries.filter((entry) => entry.state === state)

    const countVotes = (selection: readonly VoteEntry[]) =>
      selection.reduce((total, entry) => total + entry.votes, 0)
    const votes = countVotes(stateEntries)
    const nationwideVotes = countVotes(demographicEntries)

    const results = aggregateElectionResults(stateEntries, parties)
      .filter((result) => result.votes > 0)
      .sort(
        (left, right) =>
          right.percentage - left.percentage ||
          left.seatPosition - right.seatPosition ||
          left.partyAbbreviation.localeCompare(right.partyAbbreviation),
      )

    return {
      status: 'ready',
      results,
      votes,
      shareOfVoters: nationwideVotes > 0 ? votes / nationwideVotes : 0,
    }
  } catch {
    return {
      status: 'invalid',
      results: [],
      reason: 'calculationFailed',
    }
  }
}
