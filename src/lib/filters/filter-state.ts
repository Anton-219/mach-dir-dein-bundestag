import {
  createTranslationTools,
  describeAgeGroupSelection as describeLocalizedAgeGroupSelection,
  describeElectionMethodSelection as describeLocalizedElectionMethodSelection,
  describeGenderSelection as describeLocalizedGenderSelection,
  describeStateSelection as describeLocalizedStateSelection,
  getActiveFilterSummaries as getLocalizedActiveFilterSummaries,
  summarizeFilterState as summarizeLocalizedFilterState,
} from '../../i18n/formatters.ts'
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

const legacyEnglishCopy = createTranslationTools('en')

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

/**
 * @deprecated UI code should call the locale-aware formatter from src/i18n.
 */
export function describeStateSelection(excludedStates: readonly string[]): string {
  return describeLocalizedStateSelection(excludedStates, legacyEnglishCopy)
}

/**
 * @deprecated UI code should call the locale-aware formatter from src/i18n.
 */
export function describeAgeGroupSelection(
  excludedAgeGroups: readonly AgeGroup[],
): string {
  return describeLocalizedAgeGroupSelection(excludedAgeGroups, legacyEnglishCopy)
}

/**
 * @deprecated UI code should call the locale-aware formatter from src/i18n.
 */
export function describeGenderSelection(excludedGenders: readonly Gender[]): string {
  return describeLocalizedGenderSelection(excludedGenders, legacyEnglishCopy)
}

/**
 * @deprecated UI code should call the locale-aware formatter from src/i18n.
 */
export function describeElectionMethodSelection(
  excludedMethods: readonly ElectionMethod[],
): string {
  return describeLocalizedElectionMethodSelection(excludedMethods, legacyEnglishCopy)
}

/**
 * @deprecated UI code should call the locale-aware formatter from src/i18n.
 */
export function getActiveFilterSummaries(
  filters: FilterState,
): ActiveFilterSummary[] {
  return getLocalizedActiveFilterSummaries(filters, legacyEnglishCopy)
}

/**
 * @deprecated UI code should call the locale-aware formatter from src/i18n.
 */
export function summarizeFilterState(filters: FilterState): string {
  return summarizeLocalizedFilterState(filters, legacyEnglishCopy)
}
