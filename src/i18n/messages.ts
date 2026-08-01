export const englishMessages = {
  meta: {
    title: 'Build Your Bundestag',
    description:
      'A one-page application for exploring alternative Bundestag election scenarios.',
  },
  language: {
    selectionLabel: 'Language selection',
    localeNames: {
      de: 'German',
      en: 'English',
    },
    switchTo: (localeName: string) => `Switch to ${localeName}`,
  },
  header: {
    skipLink: 'Skip to analysis workspace',
    eyebrow: '2021 federal election explorer',
    title: 'Build Your Bundestag',
    introduction:
      'Adjust an electorate scenario and compare its parliament, party result, and possible majorities in one workspace.',
    methodology: 'Methodology & data',
  },
  workspace: {
    ariaLabel: 'Election results workspace',
  },
  footer: {
    title: 'Methodology and data',
    label: 'Methodology:',
    text:
      'confirmed 2021 election data and published statistical voting groups. Filtered scenarios are exploratory comparisons, not forecasts or voting recommendations.',
  },
  common: {
    reset: 'Reset',
    includeAll: 'Include all',
    included: 'Included',
    excluded: 'Excluded',
    unavailable: 'Unavailable',
    noResult: 'No result',
    resultsUnavailable: 'Results are unavailable until the election data has loaded.',
    seatCount: (count: number) => `${count} ${count === 1 ? 'seat' : 'seats'}`,
    partyCount: (count: number) => `${count} ${count === 1 ? 'party' : 'parties'}`,
  },
  scenario: {
    overviewTitle: 'Election scenario overview',
    includedVotes: 'Included votes',
    election: 'Election',
    confirmedResult: '2021 confirmed result',
    loading: 'Loading confirmed election data…',
    loadErrorTitle: 'Election data could not be loaded.',
    invalidTitle: 'Result could not be calculated.',
    emptyTitle: 'No votes included.',
    reasons: {
      noUsableVotes: 'The election data contains no usable second votes.',
      invalidVoteTotal: 'The active filters produced an invalid vote total.',
      noVotesIncluded:
        'No votes are included. Re-enable at least one value in the filters.',
      invalidParliament:
        'The active scenario produced an invalid parliamentary result.',
      calculationFailed: 'The active scenario could not be calculated.',
    },
    emptyAnnouncement: (scenarioName: string) =>
      `${scenarioName}. No votes are included in this scenario.`,
    readyAnnouncement: (
      scenarioName: string,
      votes: string,
      share: string,
      seats: number,
      majority: number,
    ) =>
      `${scenarioName}. ${votes} votes included, ${share} of the dataset. Parliament: ${seats} seats, ${majority} seats required for a majority.`,
  },
  filters: {
    kicker: 'Scenario controls',
    title: 'Filters',
    excludedBadge: (count: number) => `${count} excluded`,
    activeScenario: 'Active scenario',
    votesIncluded: (share: string) => `${share} of votes included`,
    activeExclusions: (count: number) =>
      count === 0
        ? 'No exclusions are active.'
        : `${count} ${count === 1 ? 'exclusion is' : 'exclusions are'} active.`,
    help: 'All values start included. Select a value to include or exclude it.',
    federalState: 'Federal state',
    ageGroup: 'Age group',
    gender: 'Gender',
    votingMethod: 'Voting method',
    men: 'Men',
    women: 'Women',
    postalVoting: 'Postal voting',
    inPersonVoting: 'In-person voting',
    valuesLegend: (label: string) => `${label} values`,
    filterAriaLabel: (label: string) => `${label} filter`,
    optionAriaLabel: (label: string, state: string) => `${label}: ${state}`,
    stateEditorHelp: 'Every state starts included. Select one to exclude it.',
    closeStateFilter: 'Close federal state filter',
    includedOfTotal: (included: number, total: number) =>
      `${included} of ${total} included`,
    allIncluded: 'All included',
    excludedCount: (count: number) => `${count} excluded`,
    stateDataUnavailable: 'State data is not available yet',
    summaries: {
      allVoters: 'All voters in Germany',
      allStates: 'All federal states included',
      statesCount: (count: number) => `${count} federal states excluded`,
      statesNamed: (names: string) => `${names} excluded`,
      allAgeGroups: 'All age groups included',
      ageGroupsCount: (count: number) => `${count} age groups excluded`,
      agesNamed: (ages: string) => `Ages ${ages} excluded`,
      allGenders: 'All recorded genders included',
      gendersNamed: (genders: string) => `${genders} excluded`,
      allVotingMethods: 'Postal and in-person voting included',
      votingMethodsNamed: (methods: string) => `${methods} excluded`,
    },
  },
  demographics: {
    kicker: 'Electorate context',
    title: 'Demographics',
    badge: 'Reference data',
    ageGenderTitle: 'Age and gender distribution',
    ageGenderDescription:
      'Reference distribution by age group and recorded gender. Excluded filter values are visually muted; the filter controls provide the current selection state.',
    men: 'Men',
    women: 'Women',
    votingMethod: 'Voting method',
    postal: 'Postal',
    inPerson: 'In person',
  },
  map: {
    kicker: 'Regional selection',
    title: 'Germany map',
    includedBadge: (count: number) => `${count} included`,
    resetAriaLabel: 'Reset federal state selection',
    svgTitle: 'Interactive map of German federal states',
    svgDescription:
      'Select a federal state to include or exclude it from the active election scenario. Included states are solid; excluded states use a hatched pattern.',
    stateControlAriaLabel: (
      state: string,
      currentState: string,
      action: string,
    ) => `${state}: ${currentState}. Activate to ${action}.`,
    actionInclude: 'include',
    actionExclude: 'exclude',
    includedActivateExclude: 'Included · activate to exclude',
    excludedActivateInclude: 'Excluded · activate to include',
    prompt: 'Select a state directly on the map.',
    unavailable: 'The federal-state map is not available yet.',
  },
  parliament: {
    kicker: 'Calculated result',
    title: 'Bundestag',
    seats: 'seats',
    majority: 'majority',
    parties: 'parties',
    chartTitle: 'Bundestag seat distribution',
    chartDescription: (
      resultDescription: string,
      majority: number,
    ) => `${resultDescription}. The majority threshold is ${majority} seats.`,
    partySeatDescription: (name: string, seats: number) =>
      `${name}: ${seats} seats`,
    totalSeats: 'total seats',
    majorityThreshold: 'Majority threshold:',
    representedPartiesAriaLabel: 'Parties represented in parliament',
    note:
      'Parties follow their left-to-right seat positions. CDU and CSU remain separate here and are grouped only for coalition calculations.',
  },
  parties: {
    kicker: 'Current result',
    title: 'Parties',
    represented: (count: number) => `${count} represented`,
    voteShare: 'Vote share:',
    seats: 'Seats:',
    seatsShort: 'seats',
    note:
      'Rows include every represented party and remain readable independently of color.',
  },
  coalitions: {
    kicker: 'Majority options',
    title: 'Coalitions',
    needed: (count: number) => `${count} needed`,
    summary: (count: number) =>
      `${count} minimal winning options, prioritised by fewer parties and majority margin. CDU and CSU are grouped as CDU+CSU.`,
    minimalWinning: (partyCount: number) =>
      `Minimal winning coalition · ${partyCount} ${partyCount === 1 ? 'party' : 'parties'}`,
    seats: 'seats',
    majorityMargin: (surplus: number) => `+${surplus} majority margin`,
    noCoalition:
      'No minimal winning coalition is available for the current scenario.',
  },
  stateLandscape: {
    title: 'Federal state',
    exploreMap: 'Explore the map',
    placeholder:
      'Hover over or focus a federal state on the map to see its party shares.',
    dataError: 'Data error',
    excludedFromScenario: 'Excluded from scenario',
    includedInScenario: 'Included in scenario',
    weight: (share: string, votes: string) =>
      `${share} of all voters · ${votes} votes`,
    calculationFailed: 'The state result could not be calculated.',
    unavailable: 'The state result is not available yet.',
    voteShare: 'Vote share:',
    noMatchingVotes:
      'No votes match the active demographic filters for this state.',
    note:
      'Shares respect age, gender, and voting-method filters. State exclusions do not hide this comparison.',
  },
  stateNames: {
    'Baden-Württemberg': 'Baden-Württemberg',
    Bayern: 'Bavaria',
    Berlin: 'Berlin',
    Brandenburg: 'Brandenburg',
    Bremen: 'Bremen',
    Hamburg: 'Hamburg',
    Hessen: 'Hesse',
    'Mecklenburg-Vorpommern': 'Mecklenburg-Western Pomerania',
    Niedersachsen: 'Lower Saxony',
    'Nordrhein-Westfalen': 'North Rhine-Westphalia',
    'Rheinland-Pfalz': 'Rhineland-Palatinate',
    Saarland: 'Saarland',
    Sachsen: 'Saxony',
    'Sachsen-Anhalt': 'Saxony-Anhalt',
    'Schleswig-Holstein': 'Schleswig-Holstein',
    Thüringen: 'Thuringia',
  },
}

export type MessageCatalog = typeof englishMessages
export type ScenarioReason = keyof MessageCatalog['scenario']['reasons']
export type Locale = 'de' | 'en'

export const germanMessages: MessageCatalog = {
  meta: {
    title: 'Mach dir deinen Bundestag',
    description:
      'Eine Ein-Seiten-Anwendung zum Erkunden alternativer Szenarien für die Bundestagswahl.',
  },
  language: {
    selectionLabel: 'Sprachauswahl',
    localeNames: {
      de: 'Deutsch',
      en: 'Englisch',
    },
    switchTo: (localeName: string) => `Zu ${localeName} wechseln`,
  },
  header: {
    skipLink: 'Zum Analysebereich springen',
    eyebrow: 'Bundestagswahl 2021 entdecken',
    title: 'Mach dir deinen Bundestag',
    introduction:
      'Passe ein Wählerszenario an und vergleiche Parlament, Parteiergebnisse und mögliche Mehrheiten in einer gemeinsamen Arbeitsfläche.',
    methodology: 'Methodik & Daten',
  },
  workspace: {
    ariaLabel: 'Arbeitsfläche für Wahlergebnisse',
  },
  footer: {
    title: 'Methodik und Daten',
    label: 'Methodik:',
    text:
      'bestätigte Wahldaten von 2021 und veröffentlichte statistische Wählergruppen. Gefilterte Szenarien sind explorative Vergleiche, keine Prognosen oder Wahlempfehlungen.',
  },
  common: {
    reset: 'Zurücksetzen',
    includeAll: 'Alle einschließen',
    included: 'Eingeschlossen',
    excluded: 'Ausgeschlossen',
    unavailable: 'Nicht verfügbar',
    noResult: 'Kein Ergebnis',
    resultsUnavailable: 'Ergebnisse sind erst verfügbar, wenn die Wahldaten geladen wurden.',
    seatCount: (count: number) => `${count} ${count === 1 ? 'Sitz' : 'Sitze'}`,
    partyCount: (count: number) => `${count} ${count === 1 ? 'Partei' : 'Parteien'}`,
  },
  scenario: {
    overviewTitle: 'Übersicht des Wahlszenarios',
    includedVotes: 'Einbezogene Stimmen',
    election: 'Wahl',
    confirmedResult: 'Bestätigtes Ergebnis 2021',
    loading: 'Bestätigte Wahldaten werden geladen…',
    loadErrorTitle: 'Die Wahldaten konnten nicht geladen werden.',
    invalidTitle: 'Das Ergebnis konnte nicht berechnet werden.',
    emptyTitle: 'Keine Stimmen einbezogen.',
    reasons: {
      noUsableVotes: 'Die Wahldaten enthalten keine nutzbaren Zweitstimmen.',
      invalidVoteTotal: 'Die aktiven Filter haben eine ungültige Stimmenzahl erzeugt.',
      noVotesIncluded:
        'Es sind keine Stimmen einbezogen. Aktiviere mindestens einen Wert in den Filtern erneut.',
      invalidParliament:
        'Das aktive Szenario hat ein ungültiges Parlamentsergebnis erzeugt.',
      calculationFailed: 'Das aktive Szenario konnte nicht berechnet werden.',
    },
    emptyAnnouncement: (scenarioName: string) =>
      `${scenarioName}. In diesem Szenario sind keine Stimmen einbezogen.`,
    readyAnnouncement: (
      scenarioName: string,
      votes: string,
      share: string,
      seats: number,
      majority: number,
    ) =>
      `${scenarioName}. ${votes} Stimmen einbezogen, ${share} des Datensatzes. Parlament: ${seats} Sitze, ${majority} Sitze für eine Mehrheit erforderlich.`,
  },
  filters: {
    kicker: 'Szenario steuern',
    title: 'Filter',
    excludedBadge: (count: number) => `${count} ausgeschlossen`,
    activeScenario: 'Aktives Szenario',
    votesIncluded: (share: string) => `${share} der Stimmen einbezogen`,
    activeExclusions: (count: number) =>
      count === 0
        ? 'Keine Ausschlüsse aktiv.'
        : `${count} ${count === 1 ? 'Ausschluss ist' : 'Ausschlüsse sind'} aktiv.`,
    help: 'Alle Werte sind anfangs einbezogen. Wähle einen Wert, um ihn ein- oder auszuschließen.',
    federalState: 'Bundesland',
    ageGroup: 'Altersgruppe',
    gender: 'Geschlecht',
    votingMethod: 'Wahlart',
    men: 'Männer',
    women: 'Frauen',
    postalVoting: 'Briefwahl',
    inPersonVoting: 'Urnenwahl',
    valuesLegend: (label: string) => `${label}: Werte`,
    filterAriaLabel: (label: string) => `Filter: ${label}`,
    optionAriaLabel: (label: string, state: string) => `${label}: ${state}`,
    stateEditorHelp: 'Alle Bundesländer sind anfangs einbezogen. Wähle eines, um es auszuschließen.',
    closeStateFilter: 'Bundeslandfilter schließen',
    includedOfTotal: (included: number, total: number) =>
      `${included} von ${total} einbezogen`,
    allIncluded: 'Alle einbezogen',
    excludedCount: (count: number) => `${count} ausgeschlossen`,
    stateDataUnavailable: 'Bundeslanddaten sind noch nicht verfügbar',
    summaries: {
      allVoters: 'Alle Wählerinnen und Wähler in Deutschland',
      allStates: 'Alle Bundesländer einbezogen',
      statesCount: (count: number) => `${count} Bundesländer ausgeschlossen`,
      statesNamed: (names: string) => `${names} ausgeschlossen`,
      allAgeGroups: 'Alle Altersgruppen einbezogen',
      ageGroupsCount: (count: number) => `${count} Altersgruppen ausgeschlossen`,
      agesNamed: (ages: string) => `Alter ${ages} ausgeschlossen`,
      allGenders: 'Alle erfassten Geschlechter einbezogen',
      gendersNamed: (genders: string) => `${genders} ausgeschlossen`,
      allVotingMethods: 'Brief- und Urnenwahl einbezogen',
      votingMethodsNamed: (methods: string) => `${methods} ausgeschlossen`,
    },
  },
  demographics: {
    kicker: 'Kontext der Wählerschaft',
    title: 'Demografie',
    badge: 'Referenzdaten',
    ageGenderTitle: 'Alters- und Geschlechterverteilung',
    ageGenderDescription:
      'Referenzverteilung nach Altersgruppe und erfasstem Geschlecht. Ausgeschlossene Filterwerte werden optisch abgeschwächt; die Filter zeigen den aktuellen Auswahlzustand.',
    men: 'Männer',
    women: 'Frauen',
    votingMethod: 'Wahlart',
    postal: 'Briefwahl',
    inPerson: 'Urnenwahl',
  },
  map: {
    kicker: 'Regionale Auswahl',
    title: 'Deutschlandkarte',
    includedBadge: (count: number) => `${count} einbezogen`,
    resetAriaLabel: 'Auswahl der Bundesländer zurücksetzen',
    svgTitle: 'Interaktive Karte der deutschen Bundesländer',
    svgDescription:
      'Wähle ein Bundesland, um es im aktiven Wahlszenario ein- oder auszuschließen. Einbezogene Länder sind ausgefüllt, ausgeschlossene Länder schraffiert.',
    stateControlAriaLabel: (
      state: string,
      currentState: string,
      action: string,
    ) => `${state}: ${currentState}. Aktivieren, um es ${action}.`,
    actionInclude: 'einzuschließen',
    actionExclude: 'auszuschließen',
    includedActivateExclude: 'Einbezogen · aktivieren zum Ausschließen',
    excludedActivateInclude: 'Ausgeschlossen · aktivieren zum Einbeziehen',
    prompt: 'Wähle ein Bundesland direkt auf der Karte.',
    unavailable: 'Die Bundeslandkarte ist noch nicht verfügbar.',
  },
  parliament: {
    kicker: 'Berechnetes Ergebnis',
    title: 'Bundestag',
    seats: 'Sitze',
    majority: 'Mehrheit',
    parties: 'Parteien',
    chartTitle: 'Sitzverteilung im Bundestag',
    chartDescription: (
      resultDescription: string,
      majority: number,
    ) => `${resultDescription}. Die Mehrheitsschwelle liegt bei ${majority} Sitzen.`,
    partySeatDescription: (name: string, seats: number) =>
      `${name}: ${seats} Sitze`,
    totalSeats: 'Sitze insgesamt',
    majorityThreshold: 'Mehrheitsschwelle:',
    representedPartiesAriaLabel: 'Im Parlament vertretene Parteien',
    note:
      'Die Parteien folgen ihrer Sitzposition von links nach rechts. CDU und CSU bleiben hier getrennt und werden nur für Koalitionsberechnungen zusammengefasst.',
  },
  parties: {
    kicker: 'Aktuelles Ergebnis',
    title: 'Parteien',
    represented: (count: number) => `${count} vertreten`,
    voteShare: 'Stimmenanteil:',
    seats: 'Sitze:',
    seatsShort: 'Sitze',
    note:
      'Die Liste enthält alle vertretenen Parteien und bleibt unabhängig von Farben verständlich.',
  },
  coalitions: {
    kicker: 'Mehrheitsoptionen',
    title: 'Koalitionen',
    needed: (count: number) => `${count} benötigt`,
    summary: (count: number) =>
      `${count} minimale Mehrheitsoptionen, priorisiert nach weniger Parteien und Mehrheitsabstand. CDU und CSU werden als CDU+CSU zusammengefasst.`,
    minimalWinning: (partyCount: number) =>
      `Minimale Mehrheitskoalition · ${partyCount} ${partyCount === 1 ? 'Partei' : 'Parteien'}`,
    seats: 'Sitze',
    majorityMargin: (surplus: number) => `+${surplus} Mehrheitsabstand`,
    noCoalition:
      'Für das aktuelle Szenario ist keine minimale Mehrheitskoalition verfügbar.',
  },
  stateLandscape: {
    title: 'Bundesland',
    exploreMap: 'Karte erkunden',
    placeholder:
      'Bewege den Mauszeiger über ein Bundesland oder fokussiere es, um seine Parteianteile zu sehen.',
    dataError: 'Datenfehler',
    excludedFromScenario: 'Vom Szenario ausgeschlossen',
    includedInScenario: 'Im Szenario einbezogen',
    weight: (share: string, votes: string) =>
      `${share} aller Wählerinnen und Wähler · ${votes} Stimmen`,
    calculationFailed: 'Das Ergebnis des Bundeslands konnte nicht berechnet werden.',
    unavailable: 'Das Ergebnis des Bundeslands ist noch nicht verfügbar.',
    voteShare: 'Stimmenanteil:',
    noMatchingVotes:
      'Für dieses Bundesland entsprechen keine Stimmen den aktiven demografischen Filtern.',
    note:
      'Die Anteile berücksichtigen Alters-, Geschlechts- und Wahlartfilter. Ausgeschlossene Bundesländer bleiben für diesen Vergleich sichtbar.',
  },
  stateNames: {
    'Baden-Württemberg': 'Baden-Württemberg',
    Bayern: 'Bayern',
    Berlin: 'Berlin',
    Brandenburg: 'Brandenburg',
    Bremen: 'Bremen',
    Hamburg: 'Hamburg',
    Hessen: 'Hessen',
    'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
    Niedersachsen: 'Niedersachsen',
    'Nordrhein-Westfalen': 'Nordrhein-Westfalen',
    'Rheinland-Pfalz': 'Rheinland-Pfalz',
    Saarland: 'Saarland',
    Sachsen: 'Sachsen',
    'Sachsen-Anhalt': 'Sachsen-Anhalt',
    'Schleswig-Holstein': 'Schleswig-Holstein',
    Thüringen: 'Thüringen',
  },
}

export const messageCatalogs: Record<Locale, MessageCatalog> = {
  de: germanMessages,
  en: englishMessages,
}

export const supportedLocales: readonly Locale[] = ['de', 'en']
export const defaultLocale: Locale = 'de'
