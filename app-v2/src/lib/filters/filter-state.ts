import type {
  AgeGroup,
  ElectionMethod,
  Gender,
  VoteEntry,
} from '../../models/json-contracts.ts'

export type FilterMode = 'include' | 'exclude'

export interface FilterSelection<T extends string> {
  mode: FilterMode
  values: readonly T[]
}

export interface FilterState {
  states: FilterSelection<string>
  ageGroups: FilterSelection<AgeGroup>
  genders: FilterSelection<Gender>
  electionMethods: FilterSelection<ElectionMethod>
}

export type FilterDimension = keyof FilterState

export interface ActiveFilterSummary {
  dimension: FilterDimension
  label: string
}

export function createEmptyFilterState(): FilterState {
  return {
    states: { mode: 'include', values: [] },
    ageGroups: { mode: 'include', values: [] },
    genders: { mode: 'include', values: [] },
    electionMethods: { mode: 'include', values: [] },
  }
}

export const EMPTY_FILTER_STATE = createEmptyFilterState()

export function toggleSelectionValue<T extends string>(
  selection: FilterSelection<T>,
  value: T,
): FilterSelection<T> {
  return {
    ...selection,
    values: selection.values.includes(value)
      ? selection.values.filter((currentValue) => currentValue !== value)
      : [...selection.values, value],
  }
}

export function setSelectionMode<T extends string>(
  selection: FilterSelection<T>,
  mode: FilterMode,
): FilterSelection<T> {
  return { ...selection, mode }
}

export function clearFilterDimension(
  filters: FilterState,
  dimension: FilterDimension,
): FilterState {
  return {
    ...filters,
    [dimension]: { mode: 'include', values: [] },
  }
}

function matchesSelection<T extends string>(
  value: T,
  selection: FilterSelection<T>,
): boolean {
  if (selection.values.length === 0) {
    return true
  }

  const selected = selection.values.includes(value)
  return selection.mode === 'include' ? selected : !selected
}

export function applyFilterState(
  entries: readonly VoteEntry[],
  filters: FilterState,
): VoteEntry[] {
  return entries.filter(
    (entry) =>
      matchesSelection(entry.state, filters.states) &&
      matchesSelection(entry.ageGroup, filters.ageGroups) &&
      matchesSelection(entry.gender, filters.genders) &&
      matchesSelection(entry.electionMethod, filters.electionMethods),
  )
}

export function countVotes(entries: readonly VoteEntry[]): number {
  return entries.reduce((total, entry) => total + entry.votes, 0)
}

export function countActiveFilterDimensions(filters: FilterState): number {
  return Object.values(filters).filter((selection) => selection.values.length > 0)
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

export function describeStateSelection(
  selection: FilterSelection<string>,
): string {
  if (selection.values.length === 0) {
    return 'All federal states'
  }

  if (selection.values.length > 2) {
    return selection.mode === 'include'
      ? `Only ${selection.values.length} federal states`
      : `${selection.values.length} federal states excluded`
  }

  const states = joinLabels(selection.values)
  return selection.mode === 'include'
    ? `Only ${states}`
    : `${states} excluded`
}

export function describeAgeGroupSelection(
  selection: FilterSelection<AgeGroup>,
): string {
  if (selection.values.length === 0) {
    return 'All age groups'
  }

  if (selection.values.length > 2) {
    return selection.mode === 'include'
      ? `Only ${selection.values.length} age groups`
      : `${selection.values.length} age groups excluded`
  }

  const ageGroups = joinLabels(selection.values.map(formatAgeGroup))
  return selection.mode === 'include'
    ? `Only ages ${ageGroups}`
    : `Ages ${ageGroups} excluded`
}

export function describeGenderSelection(
  selection: FilterSelection<Gender>,
): string {
  if (selection.values.length === 0) {
    return 'All recorded genders'
  }

  const labels = selection.values.map((value) => (value === 'm' ? 'Men' : 'Women'))
  const genders = joinLabels(labels)
  return selection.mode === 'include'
    ? `${genders} only`
    : `${genders} excluded`
}

export function describeElectionMethodSelection(
  selection: FilterSelection<ElectionMethod>,
): string {
  if (selection.values.length === 0) {
    return 'Postal and in-person voting'
  }

  const labels = selection.values.map((value) =>
    value === 'postal' ? 'Postal voting' : 'In-person voting',
  )
  const methods = joinLabels(labels)
  return selection.mode === 'include'
    ? `${methods} only`
    : `${methods} excluded`
}

export function getActiveFilterSummaries(
  filters: FilterState,
): ActiveFilterSummary[] {
  const summaries: ActiveFilterSummary[] = []

  if (filters.states.values.length > 0) {
    summaries.push({
      dimension: 'states',
      label: describeStateSelection(filters.states),
    })
  }
  if (filters.ageGroups.values.length > 0) {
    summaries.push({
      dimension: 'ageGroups',
      label: describeAgeGroupSelection(filters.ageGroups),
    })
  }
  if (filters.genders.values.length > 0) {
    summaries.push({
      dimension: 'genders',
      label: describeGenderSelection(filters.genders),
    })
  }
  if (filters.electionMethods.values.length > 0) {
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
