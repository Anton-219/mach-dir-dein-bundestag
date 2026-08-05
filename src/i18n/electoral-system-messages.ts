import {
  ELECTORAL_SYSTEM_IDS,
  type ElectoralSystemId,
  type ElectoralSystemResult,
  type ElectoralSystemWarning,
} from '../lib/election/index.ts'
import type { TranslationTools } from './formatters.ts'
import type { Locale } from './messages.ts'

export interface ElectoralSystemModelCopy {
  name: string
  shortName: string
  description: string
  rules: string
  dataSources: string
  limitations: string
}

interface ElectoralSystemCopyCatalog {
  selector: {
    legend: string
    help: string
    activeLabel: string
    optionsLabel: string
    optionAriaLabel: (name: string) => string
  }
  seatBreakdown: {
    directSeats: string
    listSeats: string
    uncoveredDistrictWins: string
  }
  notices: {
    title: string
    filteredFirstVotes: string
    fixedHistoricalContingents: string
    inactiveStates: (states: string) => string
    legalTie: string
    districtTie: string
  }
  methodology: {
    title: string
    summary: (modelName: string) => string
    rules: string
    dataSources: string
    limitations: string
    modelNotes: string
  }
  announcement: {
    activeModel: (modelName: string) => string
    resultComponents: (directSeats: number, listSeats: number) => string
  }
  models: Record<ElectoralSystemId, ElectoralSystemModelCopy>
}

const englishCatalog: ElectoralSystemCopyCatalog = {
  selector: {
    legend: 'Electoral system',
    help: 'Change the seat-allocation model without changing the active electorate filters.',
    activeLabel: 'Active model',
    optionsLabel: 'Available electoral systems',
    optionAriaLabel: (name) => `Use ${name}`,
  },
  seatBreakdown: {
    directSeats: 'Direct seats',
    listSeats: 'List seats',
    uncoveredDistrictWins: 'Uncovered constituency wins',
  },
  notices: {
    title: 'Model notes',
    filteredFirstVotes:
      'The electorate filters affect first and second votes together. District winners are recalculated from the filtered first votes.',
    fixedHistoricalContingents:
      'The 2021 model keeps the historical state seat contingents fixed while recalculating district winners and party allocations from the filtered votes.',
    inactiveStates: (states) =>
      `Excluded states remain part of Germany but contribute no first or second votes: ${states}.`,
    legalTie:
      'An exact apportionment tie was resolved by stable identifier order instead of a legal draw.',
    districtTie:
      'An exact positive first-vote tie was resolved by stable party order for this simulation.',
  },
  methodology: {
    title: 'Electoral-system methodology',
    summary: (modelName) => `Methodology for ${modelName}`,
    rules: 'Rules',
    dataSources: 'Data sources',
    limitations: 'Limitations',
    modelNotes: 'Active model notes',
  },
  announcement: {
    activeModel: (modelName) => `Active electoral system: ${modelName}.`,
    resultComponents: (directSeats, listSeats) =>
      `The result contains ${directSeats} direct seats and ${listSeats} list seats.`,
  },
  models: {
    'de-2021-bwahlg': {
      name: 'Electoral law used for the 2021 federal election',
      shortName: '2021 law',
      description:
        'Seat allocation under the electoral law used for the 2021 Bundestag election, including overhang and compensatory seats. Parliament can grow beyond 598 seats.',
      rules:
        'The model starts from 598 nominal seats. Every modeled constituency winner receives a direct seat, while overhang and compensatory seats can enlarge parliament. Up to three overhang seats may remain uncompensated.',
      dataSources:
        'Prepared 2021 first- and second-vote data, party qualification metadata, and the committed 2021 state-seat-contingent fixture.',
      limitations:
        'Historical state seat contingents remain fixed under electorate filters. Candidate names, state-list order, and person-level mandate assignment are not modeled.',
    },
    'de-2023-fixed-630': {
      name: 'Electoral law reformed in 2023',
      shortName: '2023 reform',
      description:
        "Seat allocation under the electoral law reformed in 2023, with a fixed size of 630 seats. A constituency win becomes a direct seat only when covered by the party's second-vote allocation.",
      rules:
        'Exactly 630 seats are allocated by second votes. Constituency wins count as direct seats only to the extent that the party has sufficient seats in the relevant state allocation; remaining wins are reported as uncovered.',
      dataSources:
        'Prepared 2021 first- and second-vote data and party qualification metadata. The historical state-seat-contingent fixture is not used by this model.',
      limitations:
        'The result is aggregate by party and state. It does not determine which individual constituency winners are covered or assign list seats to candidates.',
    },
    'union-parallel': {
      name: 'Parallel 299 + 299 model',
      shortName: 'Parallel 299+299',
      description:
        'Parallel voting with two independent tiers: up to 299 direct seats from constituencies and exactly 299 list seats allocated by second votes.',
      rules:
        'Every non-empty constituency contributes one direct seat independently of the list tier. A separate pool of exactly 299 list seats is allocated by second votes. Empty constituencies reduce the actual parliament size.',
      dataSources:
        'Prepared 2021 first- and second-vote data and party qualification metadata. No historical state-seat-contingent fixture is used.',
      limitations:
        'The model is a project-defined comparison scenario rather than enacted federal electoral law. Candidate names and list-order assignment remain outside the product scope.',
    },
  },
}

const germanCatalog: ElectoralSystemCopyCatalog = {
  selector: {
    legend: 'Wahlsystem',
    help: 'Wechsle das Sitzverteilungsmodell, ohne die aktiven Wählerfilter zu verändern.',
    activeLabel: 'Aktives Modell',
    optionsLabel: 'Verfügbare Wahlsysteme',
    optionAriaLabel: (name) => `${name} verwenden`,
  },
  seatBreakdown: {
    directSeats: 'Direktmandate',
    listSeats: 'Listenmandate',
    uncoveredDistrictWins: 'Nicht gedeckte Wahlkreissiege',
  },
  notices: {
    title: 'Hinweise zum Modell',
    filteredFirstVotes:
      'Die Wählerfilter wirken gemeinsam auf Erst- und Zweitstimmen. Die Wahlkreisgewinner werden aus den gefilterten Erststimmen neu berechnet.',
    fixedHistoricalContingents:
      'Im Modell von 2021 bleiben die historischen Sitzkontingente der Länder fest, während Wahlkreisgewinner und Parteiverteilung aus den gefilterten Stimmen neu berechnet werden.',
    inactiveStates: (states) =>
      `Ausgeschlossene Länder bleiben Teil Deutschlands, tragen aber keine Erst- oder Zweitstimmen bei: ${states}.`,
    legalTie:
      'Ein exakter Gleichstand bei der Sitzverteilung wurde statt durch Los nach stabiler Bezeichnerreihenfolge aufgelöst.',
    districtTie:
      'Ein exakter positiver Erststimmengleichstand wurde für diese Simulation nach stabiler Parteireihenfolge aufgelöst.',
  },
  methodology: {
    title: 'Methodik der Wahlsysteme',
    summary: (modelName) => `Methodik für ${modelName}`,
    rules: 'Regeln',
    dataSources: 'Datengrundlage',
    limitations: 'Grenzen',
    modelNotes: 'Hinweise zum aktiven Modell',
  },
  announcement: {
    activeModel: (modelName) => `Aktives Wahlsystem: ${modelName}.`,
    resultComponents: (directSeats, listSeats) =>
      `Das Ergebnis enthält ${directSeats} Direktmandate und ${listSeats} Listenmandate.`,
  },
  models: {
    'de-2021-bwahlg': {
      name: 'Wahlrecht der Bundestagswahl 2021',
      shortName: 'Wahlrecht 2021',
      description:
        'Sitzverteilung nach dem bei der Bundestagswahl 2021 geltenden Wahlrecht mit Überhang- und Ausgleichsmandaten. Die Größe des Bundestags kann über 598 Sitze steigen.',
      rules:
        'Das Modell beginnt mit einer Sollgröße von 598 Sitzen. Jeder modellierte Wahlkreisgewinner erhält ein Direktmandat; Überhang- und Ausgleichsmandate können den Bundestag vergrößern. Bis zu drei Überhangmandate können unausgeglichen bleiben.',
      dataSources:
        'Aufbereitete Erst- und Zweitstimmen der Bundestagswahl 2021, Metadaten zur Parteizulassung und die hinterlegte Datei mit den Sitzkontingenten der Länder für 2021.',
      limitations:
        'Die historischen Sitzkontingente der Länder bleiben bei Wählerfiltern unverändert. Kandidatennamen, Landeslistenreihenfolge und personengenaue Mandatszuweisung werden nicht modelliert.',
    },
    'de-2023-fixed-630': {
      name: '2023 reformiertes Wahlrecht',
      shortName: 'Reform 2023',
      description:
        'Sitzverteilung nach dem 2023 reformierten Wahlrecht mit einer festen Größe von 630 Sitzen. Ein Wahlkreissieg führt nur bei ausreichender Zweitstimmendeckung zu einem Direktmandat.',
      rules:
        'Genau 630 Sitze werden anhand der Zweitstimmen verteilt. Wahlkreissiege zählen nur insoweit als Direktmandate, wie die Partei in der jeweiligen Landesverteilung genügend Sitze erhält; übrige Siege werden als nicht gedeckt ausgewiesen.',
      dataSources:
        'Aufbereitete Erst- und Zweitstimmen der Bundestagswahl 2021 und Metadaten zur Parteizulassung. Die historischen Sitzkontingente der Länder werden in diesem Modell nicht verwendet.',
      limitations:
        'Das Ergebnis bleibt auf Parteien und Länder aggregiert. Es bestimmt nicht, welche einzelnen Wahlkreisgewinner gedeckt sind, und weist keine Listenplätze Personen zu.',
    },
    'union-parallel': {
      name: 'Grabenwahl 299 + 299',
      shortName: 'Grabenwahl 299+299',
      description:
        'Grabenwahl mit zwei unabhängigen Blöcken: bis zu 299 Direktmandate aus den Wahlkreisen und genau 299 Listenmandate nach Zweitstimmen.',
      rules:
        'Jeder nicht leere Wahlkreis liefert unabhängig von der Listenebene ein Direktmandat. Ein eigener Block von genau 299 Listenmandaten wird nach Zweitstimmen verteilt. Leere Wahlkreise verkleinern die tatsächliche Parlamentsgröße.',
      dataSources:
        'Aufbereitete Erst- und Zweitstimmen der Bundestagswahl 2021 und Metadaten zur Parteizulassung. Historische Sitzkontingente der Länder werden nicht verwendet.',
      limitations:
        'Das Modell ist ein projektspezifisches Vergleichsszenario und kein geltendes Bundeswahlrecht. Kandidatennamen und die Zuweisung nach Listenreihenfolge bleiben außerhalb des Produktumfangs.',
    },
  },
}

const catalogs: Record<Locale, ElectoralSystemCopyCatalog> = {
  de: germanCatalog,
  en: englishCatalog,
}

export function getElectoralSystemCatalog(
  locale: Locale,
): ElectoralSystemCopyCatalog {
  return catalogs[locale]
}

export function getElectoralSystemModelCopy(
  systemId: ElectoralSystemId,
  locale: Locale,
): ElectoralSystemModelCopy {
  return catalogs[locale].models[systemId]
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
