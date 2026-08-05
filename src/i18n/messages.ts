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
  },
  parties: {
    kicker: 'Current result',
    title: 'Parties',
    represented: (count: number) => `${count} represented`,
    voteShare: 'Vote share:',
    seats: 'Seats:',
    seatsShort: 'seats',
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
  electoralSystems: {
    selector: {
      legend: 'Electoral system',
      help: 'Change the seat-allocation model without changing the active electorate filters.',
      activeLabel: 'Active model',
      optionsLabel: 'Available electoral systems',
      optionAriaLabel: (name: string) => `Use ${name}`,
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
      inactiveStates: (states: string) =>
        `Excluded states remain part of Germany but contribute no first or second votes: ${states}.`,
      legalTie:
        'An exact apportionment tie was resolved by stable identifier order instead of a legal draw.',
      districtTie:
        'An exact positive first-vote tie was resolved by stable party order for this simulation.',
    },
    methodology: {
      title: 'Electoral-system methodology',
      summary: (modelName: string) => `Methodology for ${modelName}`,
      rules: 'Rules',
      dataSources: 'Data sources',
      limitations: 'Limitations',
      modelNotes: 'Active model notes',
    },
    announcement: {
      activeModel: (modelName: string) =>
        `Active electoral system: ${modelName}.`,
      resultComponents: (directSeats: number, listSeats: number) =>
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
export type ElectoralSystemCopyCatalog = MessageCatalog['electoralSystems']
export type ElectoralSystemModelCopy =
  ElectoralSystemCopyCatalog['models'][keyof ElectoralSystemCopyCatalog['models']]

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
      'Passe ein Wählerszenario an und vergleiche Parlament, Parteiergebnisse und mögliche Mehrheiten.',
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
      allVoters: 'Alle Wählerstimmen in Deutschland',
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
  },
  parties: {
    kicker: 'Aktuelles Ergebnis',
    title: 'Parteien',
    represented: (count: number) => `${count} vertreten`,
    voteShare: 'Stimmenanteil:',
    seats: 'Sitze:',
    seatsShort: 'Sitze',
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
  electoralSystems: {
    selector: {
      legend: 'Wahlsystem',
      help: 'Wechsle das Sitzverteilungsmodell, ohne die aktiven Wählerfilter zu verändern.',
      activeLabel: 'Aktives Modell',
      optionsLabel: 'Verfügbare Wahlsysteme',
      optionAriaLabel: (name: string) => `${name} verwenden`,
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
      inactiveStates: (states: string) =>
        `Ausgeschlossene Länder bleiben Teil Deutschlands, tragen aber keine Erst- oder Zweitstimmen bei: ${states}.`,
      legalTie:
        'Ein exakter Gleichstand bei der Sitzverteilung wurde statt durch Los nach stabiler Bezeichnerreihenfolge aufgelöst.',
      districtTie:
        'Ein exakter positiver Erststimmengleichstand wurde für diese Simulation nach stabiler Parteireihenfolge aufgelöst.',
    },
    methodology: {
      title: 'Methodik der Wahlsysteme',
      summary: (modelName: string) => `Methodik für ${modelName}`,
      rules: 'Regeln',
      dataSources: 'Datengrundlage',
      limitations: 'Grenzen',
      modelNotes: 'Hinweise zum aktiven Modell',
    },
    announcement: {
      activeModel: (modelName: string) =>
        `Aktives Wahlsystem: ${modelName}.`,
      resultComponents: (directSeats: number, listSeats: number) =>
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
