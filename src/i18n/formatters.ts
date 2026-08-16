import type {
  AgeGroup,
  ElectionMethod,
  Gender,
} from '../models/json-contracts.ts'
import type {
  FilterDimension,
  FilterState,
} from '../lib/filters/filter-state.ts'
import {
  messageCatalogs,
  type Locale,
  type MessageCatalog,
  type ScenarioReason,
} from './messages.ts'

export interface TranslationTools {
  locale: Locale
  messages: MessageCatalog
  formatNumber: (value: number) => string
  formatInputNumber: (value: number) => string
  formatPercent: (value: number) => string
  formatList: (values: readonly string[]) => string
  formatDate: (value: Date) => string
  stateName: (state: string) => string
}

export interface LocalizedFilterSummary {
  dimension: FilterDimension
  label: string
}

const localeTags: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-GB',
}

export function createTranslationTools(locale: Locale): TranslationTools {
  const localeTag = localeTags[locale]
  const messages = messageCatalogs[locale]
  const numberFormatter = new Intl.NumberFormat(localeTag)
  const inputNumberFormatter = new Intl.NumberFormat(localeTag, {
    useGrouping: false,
    maximumFractionDigits: 6,
  })
  const percentFormatter = new Intl.NumberFormat(localeTag, {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  const listFormatter = new Intl.ListFormat(localeTag, {
    style: 'long',
    type: 'conjunction',
  })
  const dateFormatter = new Intl.DateTimeFormat(localeTag, {
    dateStyle: 'long',
  })

  return {
    locale,
    messages,
    formatNumber: (value) => numberFormatter.format(value),
    formatInputNumber: (value) => inputNumberFormatter.format(value),
    formatPercent: (value) => percentFormatter.format(value),
    formatList: (values) => listFormatter.format(values),
    formatDate: (value) => dateFormatter.format(value),
    stateName: (state) =>
      messages.stateNames[state as keyof MessageCatalog['stateNames']] ?? state,
  }
}

function formatAgeGroup(ageGroup: AgeGroup): string {
  return ageGroup.replace('-', '–')
}

export function describeStateSelection(
  excludedStates: readonly string[],
  i18n: TranslationTools,
): string {
  if (excludedStates.length === 0) {
    return i18n.messages.filters.summaries.allStates
  }

  if (excludedStates.length > 2) {
    return i18n.messages.filters.summaries.statesCount(excludedStates.length)
  }

  return i18n.messages.filters.summaries.statesNamed(
    i18n.formatList(excludedStates.map(i18n.stateName)),
  )
}

export function describeAgeGroupSelection(
  excludedAgeGroups: readonly AgeGroup[],
  i18n: TranslationTools,
): string {
  if (excludedAgeGroups.length === 0) {
    return i18n.messages.filters.summaries.allAgeGroups
  }

  if (excludedAgeGroups.length > 2) {
    return i18n.messages.filters.summaries.ageGroupsCount(
      excludedAgeGroups.length,
    )
  }

  return i18n.messages.filters.summaries.agesNamed(
    i18n.formatList(excludedAgeGroups.map(formatAgeGroup)),
  )
}

export function describeGenderSelection(
  excludedGenders: readonly Gender[],
  i18n: TranslationTools,
): string {
  if (excludedGenders.length === 0) {
    return i18n.messages.filters.summaries.allGenders
  }

  const labels = excludedGenders.map((value) =>
    value === 'm' ? i18n.messages.filters.men : i18n.messages.filters.women,
  )

  return i18n.messages.filters.summaries.gendersNamed(
    i18n.formatList(labels),
  )
}

export function describeElectionMethodSelection(
  excludedMethods: readonly ElectionMethod[],
  i18n: TranslationTools,
): string {
  if (excludedMethods.length === 0) {
    return i18n.messages.filters.summaries.allVotingMethods
  }

  const labels = excludedMethods.map((value) =>
    value === 'postal'
      ? i18n.messages.filters.postalVoting
      : i18n.messages.filters.inPersonVoting,
  )

  return i18n.messages.filters.summaries.votingMethodsNamed(
    i18n.formatList(labels),
  )
}

export function getActiveFilterSummaries(
  filters: FilterState,
  i18n: TranslationTools,
): LocalizedFilterSummary[] {
  const summaries: LocalizedFilterSummary[] = []

  if (filters.states.length > 0) {
    summaries.push({
      dimension: 'states',
      label: describeStateSelection(filters.states, i18n),
    })
  }
  if (filters.ageGroups.length > 0) {
    summaries.push({
      dimension: 'ageGroups',
      label: describeAgeGroupSelection(filters.ageGroups, i18n),
    })
  }
  if (filters.genders.length > 0) {
    summaries.push({
      dimension: 'genders',
      label: describeGenderSelection(filters.genders, i18n),
    })
  }
  if (filters.electionMethods.length > 0) {
    summaries.push({
      dimension: 'electionMethods',
      label: describeElectionMethodSelection(filters.electionMethods, i18n),
    })
  }

  return summaries
}

export function summarizeFilterState(
  filters: FilterState,
  i18n: TranslationTools,
): string {
  const summaries = getActiveFilterSummaries(filters, i18n)
  return summaries.length === 0
    ? i18n.messages.filters.summaries.allVoters
    : summaries.map((summary) => summary.label).join(' · ')
}

export function getScenarioReasonText(
  reason: ScenarioReason | undefined,
  i18n: TranslationTools,
): string {
  return reason
    ? i18n.messages.scenario.reasons[reason]
    : i18n.messages.common.resultsUnavailable
}
