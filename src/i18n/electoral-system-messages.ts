import {
  ELECTORAL_SYSTEM_IDS,
  type ElectoralSystemId,
  type ElectoralSystemResult,
  type ElectoralSystemWarning,
} from '../lib/election/index.ts'
import type { TranslationTools } from './formatters.ts'
import {
  messageCatalogs,
  type ElectoralSystemCopyCatalog,
  type ElectoralSystemModelCopy,
  type Locale,
} from './messages.ts'

export type { ElectoralSystemModelCopy } from './messages.ts'

export function getElectoralSystemCatalog(
  locale: Locale,
): ElectoralSystemCopyCatalog {
  return messageCatalogs[locale].electoralSystems
}

export function getElectoralSystemModelCopy(
  systemId: ElectoralSystemId,
  locale: Locale,
): ElectoralSystemModelCopy {
  return getElectoralSystemCatalog(locale).models[systemId]
}

export function getElectoralSystemOptions(locale: Locale) {
  return ELECTORAL_SYSTEM_IDS.map((systemId) => ({
    systemId,
    ...getElectoralSystemModelCopy(systemId, locale),
  }))
}

function getWarningStates(
  warning: ElectoralSystemWarning,
  i18n: TranslationTools,
): string | undefined {
  const states = warning.details?.states
  if (!Array.isArray(states) || !states.every((state) => typeof state === 'string')) {
    return undefined
  }
  return i18n.formatList(states.map(i18n.stateName))
}

export function formatElectoralSystemWarning(
  warning: ElectoralSystemWarning,
  i18n: TranslationTools,
): string {
  const copy = getElectoralSystemCatalog(i18n.locale).notices
  switch (warning.code) {
    case 'FILTERED_FIRST_VOTE_MODEL':
      return copy.filteredFirstVotes
    case 'INACTIVE_STATE_SIMULATION': {
      const states = getWarningStates(warning, i18n)
      return states === undefined ? copy.filteredFirstVotes : copy.inactiveStates(states)
    }
    case 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER':
      return copy.legalTie
    case 'DISTRICT_TIE_REPLACED_BY_STABLE_ORDER':
      return copy.districtTie
  }
}

export function getElectoralSystemNoticeTexts(
  result: ElectoralSystemResult,
  i18n: TranslationTools,
): string[] {
  const copy = getElectoralSystemCatalog(i18n.locale).notices
  const notices = result.warnings.map((warning) =>
    formatElectoralSystemWarning(warning, i18n),
  )
  if (
    result.systemId === 'de-2021-bwahlg' &&
    result.scenarioMode === 'filtered-model'
  ) {
    notices.push(copy.fixedHistoricalContingents)
  }
  return [...new Set(notices)]
}
