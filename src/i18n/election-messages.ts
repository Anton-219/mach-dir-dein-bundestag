import type { ElectionYear } from '../data/elections.ts'
import type { ElectoralSystemId } from '../lib/election/index.ts'
import type { Locale } from './messages.ts'

export interface ElectionSourceCopy {
  label: string
  description: string
  href: string
}

interface ElectionCopy {
  eyebrow: string
  confirmedResult: string
  methodologyIntroduction: string
  officialTotals: string
  sources: readonly ElectionSourceCopy[]
}

const commonEnglishSources: readonly ElectionSourceCopy[] = [
  {
    label: 'Germany federal-state map',
    description:
      'GeoJSON geometry used for the interactive map of the German federal states.',
    href: 'https://github.com/isellsoap/deutschlandGeoJSON',
  },
  {
    label: 'Federal Elections Act',
    description:
      'Current consolidated text of the Bundeswahlgesetz, including the 630-seat allocation and second-vote coverage rules.',
    href: 'https://www.gesetze-im-internet.de/bwahlg/',
  },
  {
    label: 'Federal Constitutional Court judgment of 30 July 2024',
    description:
      'Judgment on the 2023 reform and the transitional continuation of the three-constituency rule.',
    href: 'https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2024/07/fs20240730_2bvf000123.html',
  },
]

const commonGermanSources: readonly ElectionSourceCopy[] = [
  {
    label: 'Deutschlandkarte der Bundesländer',
    description:
      'GeoJSON-Geometrie für die interaktive Karte der deutschen Bundesländer.',
    href: 'https://github.com/isellsoap/deutschlandGeoJSON',
  },
  {
    label: 'Bundeswahlgesetz',
    description:
      'Aktuelle Fassung des Bundeswahlgesetzes, einschließlich der Sitzverteilung mit 630 Sitzen und der Zweitstimmendeckung.',
    href: 'https://www.gesetze-im-internet.de/bwahlg/',
  },
  {
    label: 'Urteil des Bundesverfassungsgerichts vom 30. Juli 2024',
    description:
      'Urteil zur Wahlrechtsreform von 2023 und zur übergangsweisen Fortgeltung der Grundmandatsklausel.',
    href: 'https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2024/07/fs20240730_2bvf000123.html',
  },
]

const englishElectionCopy: Record<ElectionYear, ElectionCopy> = {
  2021: {
    eyebrow: '2021 federal election explorer',
    confirmedResult: '2021 confirmed result',
    methodologyIntroduction:
      'The application recalculates one filtered 2021 federal-election vote scenario under three electoral systems. The results are transparent political simulations, not official election results, forecasts, or voting recommendations.',
    officialTotals:
      'Official 2021 constituency totals by party, vote type, and postal or in-person voting remain fixed.',
    sources: [
      {
        label: 'Official results of the 2021 Bundestag election',
        description:
          'Constituency and federal-state results, downloadable result tables, and the confirmed national outcome.',
        href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse/weitere-ergebnisse.html',
      },
      {
        label: 'Representative election statistics for 2021',
        description:
          'Published voting behaviour by gender category, age group, and postal or in-person voting.',
        href: 'https://bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse/repraesentative-wahlstatistik.html',
      },
      {
        label: '2021 polling-district results archive',
        description:
          'Official source archive containing the polling-district result file used to prepare the constituency vote data.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/c2cd99e6-064e-4ebc-b634-f86b5c0e14b3/btw21_wbz.zip',
      },
      {
        label: '2021 representative-statistics CSV',
        description:
          'Official source table used for the demographic profiles in the prepared vote data.',
        href: 'https://bundeswahlleiterin.de/dam/jcr/2aaec1fb-745a-422d-9ef0-0be7c9ca0ac9/btw21_rws_bw2.csv',
      },
      {
        label: '2021 state seat contingents',
        description:
          'The historical distribution of the 598 initial seats among the federal states used by the pre-2023 model.',
        href: 'https://www.bundeswahlleiterin.de/mitteilungen/bundestagswahlen/2021/20210909_btw21-sitzkontingente.html',
      },
      ...commonEnglishSources,
    ],
  },
  2025: {
    eyebrow: '2025 federal election explorer',
    confirmedResult: '2025 confirmed result',
    methodologyIntroduction:
      'The application recalculates one filtered 2025 federal-election vote scenario under three electoral systems. The results are transparent political simulations, not official election results, forecasts, or voting recommendations.',
    officialTotals:
      'Official 2025 constituency totals by party, vote type, and postal or in-person voting remain fixed.',
    sources: [
      {
        label: 'Official results of the 2025 Bundestag election',
        description:
          'Constituency and federal-state results, downloadable result tables, and the confirmed national outcome.',
        href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/weitere-ergebnisse.html',
      },
      {
        label: 'Representative election statistics for 2025',
        description:
          'Published voting behaviour by gender category, age group, and postal or in-person voting.',
        href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/repraesentative-wahlstatistik.html',
      },
      {
        label: '2025 polling-district results archive',
        description:
          'Official source archive containing the polling-district result file used to prepare the constituency vote data.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/e79a7bd3-0607-4e87-9752-8e601e299e00/btw25_wbz.zip',
      },
      {
        label: '2025 representative-statistics CSV',
        description:
          'Official source table used for the demographic profiles in the prepared vote data.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/de1bf90b-ae2e-43d6-8974-0a1e0a0a72e3/btw25_rws_bst2.csv',
      },
      {
        label: '2025 state seat contingents for the pre-2023 model',
        description:
          'Official worked seat calculation providing the 598-seat state contingents used when applying the 2021 electoral law to the 2025 vote data.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/099c2094-2785-49d6-9567-94abc8bfcb19/bwg2020_sitzberechnung_erg2025.pdf',
      },
      ...commonEnglishSources,
    ],
  },
}

const germanElectionCopy: Record<ElectionYear, ElectionCopy> = {
  2021: {
    eyebrow: 'Bundestagswahl 2021 entdecken',
    confirmedResult: 'Bestätigtes Ergebnis 2021',
    methodologyIntroduction:
      'Die Anwendung berechnet dasselbe gefilterte Stimmenszenario der Bundestagswahl 2021 mit drei Wahlsystemen neu. Die Ergebnisse sind transparente politische Simulationen, keine amtlichen Wahlergebnisse, Prognosen oder Wahlempfehlungen.',
    officialTotals:
      'Die amtlichen Wahlkreissummen von 2021 nach Partei, Stimmenart und Brief- oder Urnenwahl bleiben unverändert.',
    sources: [
      {
        label: 'Amtliche Ergebnisse der Bundestagswahl 2021',
        description:
          'Wahlkreis- und Landesergebnisse, herunterladbare Ergebnistabellen und das festgestellte Gesamtergebnis.',
        href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse/weitere-ergebnisse.html',
      },
      {
        label: 'Repräsentative Wahlstatistik 2021',
        description:
          'Veröffentlichtes Wahlverhalten nach Geschlechtskategorie, Altersgruppe sowie Brief- oder Urnenwahl.',
        href: 'https://bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse/repraesentative-wahlstatistik.html',
      },
      {
        label: 'Wahlbezirksdaten 2021',
        description:
          'Amtliches Archiv mit der Wahlbezirksdatei, aus der die Wahlkreisdaten der Anwendung aufbereitet wurden.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/c2cd99e6-064e-4ebc-b634-f86b5c0e14b3/btw21_wbz.zip',
      },
      {
        label: 'CSV der repräsentativen Wahlstatistik 2021',
        description:
          'Amtliche Ausgangstabelle für die demografischen Profile der aufbereiteten Stimmdaten.',
        href: 'https://bundeswahlleiterin.de/dam/jcr/2aaec1fb-745a-422d-9ef0-0be7c9ca0ac9/btw21_rws_bw2.csv',
      },
      {
        label: 'Sitzkontingente der Länder 2021',
        description:
          'Historische Verteilung der 598 Ausgangssitze auf die Länder für das Modell des Wahlrechts vor 2023.',
        href: 'https://www.bundeswahlleiterin.de/mitteilungen/bundestagswahlen/2021/20210909_btw21-sitzkontingente.html',
      },
      ...commonGermanSources,
    ],
  },
  2025: {
    eyebrow: 'Bundestagswahl 2025 entdecken',
    confirmedResult: 'Bestätigtes Ergebnis 2025',
    methodologyIntroduction:
      'Die Anwendung berechnet dasselbe gefilterte Stimmenszenario der Bundestagswahl 2025 mit drei Wahlsystemen neu. Die Ergebnisse sind transparente politische Simulationen, keine amtlichen Wahlergebnisse, Prognosen oder Wahlempfehlungen.',
    officialTotals:
      'Die amtlichen Wahlkreissummen von 2025 nach Partei, Stimmenart und Brief- oder Urnenwahl bleiben unverändert.',
    sources: [
      {
        label: 'Amtliche Ergebnisse der Bundestagswahl 2025',
        description:
          'Wahlkreis- und Landesergebnisse, herunterladbare Ergebnistabellen und das festgestellte Gesamtergebnis.',
        href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/weitere-ergebnisse.html',
      },
      {
        label: 'Repräsentative Wahlstatistik 2025',
        description:
          'Veröffentlichtes Wahlverhalten nach Geschlechtskategorie, Altersgruppe sowie Brief- oder Urnenwahl.',
        href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/repraesentative-wahlstatistik.html',
      },
      {
        label: 'Wahlbezirksdaten 2025',
        description:
          'Amtliches Archiv mit der Wahlbezirksdatei, aus der die Wahlkreisdaten der Anwendung aufbereitet wurden.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/e79a7bd3-0607-4e87-9752-8e601e299e00/btw25_wbz.zip',
      },
      {
        label: 'CSV der repräsentativen Wahlstatistik 2025',
        description:
          'Amtliche Ausgangstabelle für die demografischen Profile der aufbereiteten Stimmdaten.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/de1bf90b-ae2e-43d6-8974-0a1e0a0a72e3/btw25_rws_bst2.csv',
      },
      {
        label: 'Sitzkontingente der Länder für 2025',
        description:
          'Amtliche Sitzberechnung mit den 598 Länder-Sitzkontingenten, die beim Anwenden des Wahlrechts von 2021 auf die Stimmen von 2025 verwendet werden.',
        href: 'https://www.bundeswahlleiterin.de/dam/jcr/099c2094-2785-49d6-9567-94abc8bfcb19/bwg2020_sitzberechnung_erg2025.pdf',
      },
      ...commonGermanSources,
    ],
  },
}

export function getElectionCopy(
  locale: Locale,
  electionYear: ElectionYear,
): ElectionCopy {
  return locale === 'de'
    ? germanElectionCopy[electionYear]
    : englishElectionCopy[electionYear]
}

export function getElectionSelectionLabel(locale: Locale): string {
  return locale === 'de' ? 'Bundestagswahl' : 'Federal election'
}

export function getAllElectionSources(
  locale: Locale,
): readonly ElectionSourceCopy[] {
  const catalog = locale === 'de' ? germanElectionCopy : englishElectionCopy
  const sources = [catalog[2021].sources, catalog[2025].sources].flat()
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
  const historical = systemId === 'de-2021-bwahlg'
  if (locale === 'de') {
    return historical
      ? `Aufbereitete Erst- und Zweitstimmendaten von ${electionYear}, Metadaten zur Parteienqualifikation und das hinterlegte Länder-Sitzkontingent von ${electionYear}.`
      : `Aufbereitete Erst- und Zweitstimmendaten von ${electionYear} und Metadaten zur Parteienqualifikation. Das historische Länder-Sitzkontingent wird von diesem Modell nicht verwendet.`
  }

  return historical
    ? `Prepared ${electionYear} first- and second-vote data, party qualification metadata, and the committed ${electionYear} state-seat-contingent fixture.`
    : `Prepared ${electionYear} first- and second-vote data and party qualification metadata. The historical state-seat-contingent fixture is not used by this model.`
}
