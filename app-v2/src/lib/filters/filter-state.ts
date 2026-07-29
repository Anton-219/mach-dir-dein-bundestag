import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  VoteEntry,
} from '../../models/json-contracts.ts'

export interface FilterState {
  states: string[]
  ageGroups: AgeGroup[]
  genders: Gender[]
  electionMethods: ElectionMethod[]
}

export const EMPTY_FILTER_STATE: FilterState = {
  states: [],
  ageGroups: [],
  genders: [],
  electionMethods: [],
}

export function applyFilterState(
  entries: readonly VoteEntry[],
  filters: FilterState,
): VoteEntry[] {
  return entries.filter(
    (entry) =>
      (filters.states.length === 0 || filters.states.includes(entry.state)) &&
      (filters.ageGroups.length === 0 ||
        filters.ageGroups.includes(entry.ageGroup)) &&
      (filters.genders.length === 0 || filters.genders.includes(entry.gender)) &&
      (filters.electionMethods.length === 0 ||
        filters.electionMethods.includes(entry.electionMethod)),
  )
}

export function toggleFilterValue<T extends string>(
  values: readonly T[],
  value: T,
): T[] {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value]
}

export function countActiveFilterDimensions(filters: FilterState): number {
  return [
    filters.states,
    filters.ageGroups,
    filters.genders,
    filters.electionMethods,
  ].filter((values) => values.length > 0).length
}

export function countVotes(entries: readonly VoteEntry[]): number {
  return entries.reduce((total, entry) => total + entry.votes, 0)
}

export function summarizeFilterState(filters: FilterState): string {
  const parts: string[] = []

  if (filters.states.length > 0) {
    parts.push(
      filters.states.length === 1
        ? filters.states[0] ?? ''
        : `${filters.states.length} federal states`,
    )
  }
  if (filters.ageGroups.length > 0) {
    parts.push(
      filters.ageGroups.length === 1
        ? `age ${filters.ageGroups[0]}`
        : `${filters.ageGroups.length} age groups`,
    )
  }
  if (filters.genders.length > 0) {
    parts.push(
      filters.genders.length === 1
        ? filters.genders[0] === 'm'
          ? 'men'
          : 'women'
        : 'all recorded genders',
    )
  }
  if (filters.electionMethods.length > 0) {
    parts.push(
      filters.electionMethods.length === 1
        ? filters.electionMethods[0] === 'postal'
          ? 'postal voting'
          : 'in-person voting'
        : 'postal and in-person voting',
    )
  }

  return parts.length === 0 ? 'All voters in Germany' : parts.join(' · ')
}
