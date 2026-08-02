import type { VoteEntry } from '../../models/json-contracts.ts'
import type { VoteEntryFilter } from './types.ts'

export function filterVoteEntries(
  entries: readonly VoteEntry[],
  filters: readonly VoteEntryFilter[],
): VoteEntry[] {
  return entries.filter((entry) =>
    filters.every((filterRule) => filterRule.matches(entry)),
  )
}
