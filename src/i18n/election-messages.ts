import { ELECTION_YEARS, type ElectionYear } from '../data/elections.ts'
import type { ElectoralSystemId } from '../lib/election/index.ts'
import {
  messageCatalogs,
  type ElectionCopy,
  type ElectionCopyCatalog,
  type ElectionSourceCopy,
  type Locale,
} from './messages.ts'

export type { ElectionCopy, ElectionSourceCopy } from './messages.ts'

export function getElectionCatalog(locale: Locale): ElectionCopyCatalog {
  return messageCatalogs[locale].elections
}

export function getElectionCopy(
  locale: Locale,
  electionYear: ElectionYear,
): ElectionCopy {
  return getElectionCatalog(locale).years[electionYear]
}

export function getElectionSelectionLabel(locale: Locale): string {
  return getElectionCatalog(locale).selectionLabel
}

export function getAllElectionSources(
  locale: Locale,
): readonly ElectionSourceCopy[] {
  const sources = ELECTION_YEARS.flatMap(
    (electionYear) => getElectionCopy(locale, electionYear).sources,
  )
  return sources.filter(
    (source, index) =>
      sources.findIndex((candidate) => candidate.href === source.href) === index,
  )
}

export function getElectionModelDataSources(
  locale: Locale,
  electionYear: ElectionYear,
  systemId: ElectoralSystemId,
): string {
  const copy = getElectionCatalog(locale).modelDataSources
  return systemId === 'de-2021-bwahlg'
    ? copy.historicalContingents(electionYear)
    : copy.withoutContingents(electionYear)
}
