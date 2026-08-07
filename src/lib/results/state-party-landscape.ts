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
    // Single pass over the prepared records. The nationwide comparison only
    // needs a running sum, so the demographic subset is never materialized;
    // just the selected state's entries are collected for the aggregation.
    const stateEntries: VoteEntry[] = []
    let votes = 0
    let nationwideVotes = 0

    for (const entry of entries) {
      if (
        filters.ageGroups.includes(entry.ageGroup) ||
        filters.genders.includes(entry.gender) ||
        filters.electionMethods.includes(entry.electionMethod)
      ) {
        continue
      }

      nationwideVotes += entry.votes

      if (entry.state === state) {
        stateEntries.push(entry)
        votes += entry.votes
      }
    }

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
