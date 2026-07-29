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

export interface ActiveFilterSummary {
  dimension: FilterDimension
  label: string
}

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

function joinLabels(labels: readonly string[]): string {
  if (labels.length < 2) {
    return labels[0] ?? ''
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`
}

function formatAgeGroup(ageGroup: AgeGroup): string {
  return ageGroup.replace('-', '–')
}

export function describeStateSelection(excludedStates: readonly string[]): string {
  if (excludedStates.length === 0) {
    return 'All federal states included'
  }

  if (excludedStates.length > 2) {
    return `${excludedStates.length} federal states excluded`
  }

  return `${joinLabels(excludedStates)} excluded`
}

export function describeAgeGroupSelection(
  excludedAgeGroups: readonly AgeGroup[],
): string {
  if (excludedAgeGroups.length === 0) {
    return 'All age groups included'
  }

  if (excludedAgeGroups.length > 2) {
    return `${excludedAgeGroups.length} age groups excluded`
  }

  return `Ages ${joinLabels(excludedAgeGroups.map(formatAgeGroup))} excluded`
}

export function describeGenderSelection(excludedGenders: readonly Gender[]): string {
  if (excludedGenders.length === 0) {
    return 'All recorded genders included'
  }

  const labels = excludedGenders.map((value) => (value === 'm' ? 'Men' : 'Women'))
  return `${joinLabels(labels)} excluded`
}

export function describeElectionMethodSelection(
  excludedMethods: readonly ElectionMethod[],
): string {
  if (excludedMethods.length === 0) {
    return 'Postal and in-person voting included'
  }

  const labels = excludedMethods.map((value) =>
    value === 'postal' ? 'Postal voting' : 'In-person voting',
  )
  return `${joinLabels(labels)} excluded`
}

export function getActiveFilterSummaries(
  filters: FilterState,
): ActiveFilterSummary[] {
  const summaries: ActiveFilterSummary[] = []

  if (filters.states.length > 0) {
    summaries.push({
      dimension: 'states',
      label: describeStateSelection(filters.states),
    })
  }
  if (filters.ageGroups.length > 0) {
    summaries.push({
      dimension: 'ageGroups',
      label: describeAgeGroupSelection(filters.ageGroups),
    })
  }
  if (filters.genders.length > 0) {
    summaries.push({
      dimension: 'genders',
      label: describeGenderSelection(filters.genders),
    })
  }
  if (filters.electionMethods.length > 0) {
    summaries.push({
      dimension: 'electionMethods',
      label: describeElectionMethodSelection(filters.electionMethods),
    })
  }

  return summaries
}

export function summarizeFilterState(filters: FilterState): string {
  const summaries = getActiveFilterSummaries(filters)
  return summaries.length === 0
    ? 'All voters in Germany'
    : summaries.map((summary) => summary.label).join(' · ')
}
