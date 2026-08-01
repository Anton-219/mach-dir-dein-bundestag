import type { FilterState } from '../filters/filter-state.ts'
import { aggregateElectionResults } from '../election/aggregate-election-results.ts'
import type { ElectionResult } from '../../models/calculation-results.ts'
import type { Party, VoteEntry } from '../../models/json-contracts.ts'

export type StatePartyLandscape =
  | {
      status: 'ready'
      results: ElectionResult[]
    }
  | {
      status: 'invalid'
      results: []
      message: string
    }

export function buildStatePartyLandscape(
  entries: readonly VoteEntry[],
  parties: readonly Party[],
  state: string,
  filters: FilterState,
): StatePartyLandscape {
  try {
    const stateEntries = entries.filter(
      (entry) =>
        entry.state === state &&
        !filters.ageGroups.includes(entry.ageGroup) &&
        !filters.genders.includes(entry.gender) &&
        !filters.electionMethods.includes(entry.electionMethod),
    )

    const results = aggregateElectionResults(stateEntries, parties)
      .filter((result) => result.votes > 0)
      .sort(
        (left, right) =>
          right.percentage - left.percentage ||
          left.seatPosition - right.seatPosition ||
          left.partyAbbreviation.localeCompare(right.partyAbbreviation),
      )

    return { status: 'ready', results }
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : ''

    return {
      status: 'invalid',
      results: [],
      message: `The state result could not be calculated.${detail}`,
    }
  }
}
