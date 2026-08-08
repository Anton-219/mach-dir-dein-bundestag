import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  VoteEntry,
} from '../../models/json-contracts.ts'

export interface FilterState {
  states: readonly string[]
  ageGroups: readonly AgeGroup[]
  genders: readonly Gender[]
  electionMethods: readonly ElectionMethod[]
}

export type FilterDimension = keyof FilterState

export function createEmptyFilterState(): FilterState {
  return {
    states: [],
    ageGroups: [],
    genders: [],
    electionMethods: [],
  }
}

export const EMPTY_FILTER_STATE = createEmptyFilterState()

export function toggleExcludedValue<T extends string>(
  excludedValues: readonly T[],
  value: T,
): readonly T[] {
  return excludedValues.includes(value)
    ? excludedValues.filter((currentValue) => currentValue !== value)
    : [...excludedValues, value]
}

export function invertExcludedValues<T extends string>(
  availableValues: readonly T[],
  excludedValues: readonly T[],
): readonly T[] {
  return availableValues.filter((value) => !excludedValues.includes(value))
}

export function clearFilterDimension(
  filters: FilterState,
  dimension: FilterDimension,
): FilterState {
  return {
    ...filters,
    [dimension]: [],
  }
}

export function applyFilterState(
  entries: readonly VoteEntry[],
  filters: FilterState,
): VoteEntry[] {
  return entries.filter(
    (entry) =>
      !filters.states.includes(entry.state) &&
      !filters.ageGroups.includes(entry.ageGroup) &&
      !filters.genders.includes(entry.gender) &&
      !filters.electionMethods.includes(entry.electionMethod),
  )
}

export function countVotes(entries: readonly VoteEntry[]): number {
  return entries.reduce((total, entry) => total + entry.votes, 0)
}

export function countActiveFilterDimensions(filters: FilterState): number {
  return Object.values(filters).filter((excludedValues) => excludedValues.length > 0)
    .length
}
