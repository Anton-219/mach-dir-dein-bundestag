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
    title: 'Calculation transparency',
    label: 'Transparency:',
    text:
      'All calculations run entirely in your browser. Despite automated tests, errors in formulas or implementation may distort the results. The results are simulations, not official calculations.',
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
      title: 'Methodology and data',
      close: 'Close methodology',
      activeModel: 'Active model',
      introduction:
        'The application recalculates one filtered 2021 vote scenario under three electoral systems. The results are transparent political simulations, not official election results, forecasts, or voting recommendations.',
      scenarioTitle: 'How filters are interpreted',
      scenarioAssumptions: [
        'Filters remove matching first and second votes. They do not change the population, the 16 federal states, the 299 constituencies, their boundaries, or the institutional starting size of an electoral system.',
        'Excluding a federal state means that no votes from that state are counted. The state remains part of Germany and keeps its constituencies.',
        'A constituency with no included first votes has no winner. The application never creates a winner from alphabetical order, a party identifier, or random choice.',
        'An exact positive first-vote tie is resolved by a stable party order so that repeated calculations remain identical. This is a simulation rule, not the legally prescribed drawing of lots.',
        'The result is aggregated by party. Candidate names, list positions, and person-level mandate assignments are not calculated.',
      ],
      dataPreparationTitle: 'How the vote data is prepared',
      dataPreparationItems: [
        'Official 2021 constituency totals by party, vote type, and postal or in-person voting remain fixed.',
        'The source does not publish the full combination of constituency, party, first or second vote, age, gender category, and voting method. The demographic detail is therefore estimated from published aggregate tables.',
        'Published representative statistics are used as proportions and fitted to the exact official totals. The resulting values are fractional vote weights, not individual ballot records.',
        'For a party and voting method, every constituency in a federal state currently receives the same fitted demographic profile. Parties without a separate published profile use the state profile for “Other parties” or, as a final fallback, an even distribution.',
        'The published male category also contains people recorded as diverse or without a gender entry in the birth register. The application preserves the source categories and does not reinterpret them.',
      ],
      systemsTitle: 'Compared electoral systems',
      summary: (modelName: string) => `Methodology for ${modelName}`,
      rules: 'Rules and assumptions',
      dataSources: 'Data used by the model',
      limitations: 'Limits and special cases',
      modelNotes: 'Notes for the active result',
      majorityTitle: 'Majorities',
      majorityText:
        'The absolute majority is always calculated from the parliament that was actually produced: floor(total seats ÷ 2) + 1. It is not stored as a fixed number.',
      calculationTitle: 'Calculation and possible errors',
      calculationText:
        'All filtering and seat calculations take place in the browser. Calculation errors, incorrectly implemented rules, or overlooked special cases may be included and distort the results.',
      historicalSeatGrowthTitle: 'A note on seat allocation and the number of seats',
      historicalSeatGrowthParagraphs: [
        'While experimenting with the filters, the number of seats in the Bundestag can practically explode. In my assessment, this comes from the overhang seats in combination with the constituencies won. Because the old calculation system means direct mandates always have to enter the Bundestag, the other parties have to receive more seats as compensation.',
        'Constituency victories, however, favour many narrow leads. If a party generally receives few second votes in a small number of areas but is stable nationwide, those narrow leads can, so to speak, "add up".',
        'Of course, I also cannot rule out that the calculations running in the background are wrong. A lot of complex things interlock there.',
      ],
      sourcesTitle: 'Sources',
      sourcesIntroduction:
        'The prepared application files are derived from the following official publications. The detailed transformation and validation steps are documented in the project notebooks and data-preparation documentation.',
      sources: [
        {
          label: 'Official results of the 2021 Bundestag election',
          description:
            'Constituency and federal-state results, downloadable result tables, and the confirmed national outcome.',
          href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse.html',
        },
        {
          label: 'Representative election statistics for 2021',
          description:
            'Published voting behaviour by gender category, age group, and postal or in-person voting.',
          href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse/repraesentative-wahlstatistik.html',
        },
        {
          label: '2021 state seat contingents',
          description:
            'The historical distribution of the 598 initial seats among the federal states used by the 2021 model.',
          href: 'https://www.bundeswahlleiterin.de/mitteilungen/bundestagswahlen/2021/20210909_btw21-sitzkontingente.html',
        },
        {
          label: 'Explanation of the 2021 seat allocation',
          description:
            'Official worked explanation of the historical allocation procedure, including overhang and compensatory seats.',
          href: 'https://www.bundeswahlleiterin.de/dam/jcr/e9eb08cc-e19e-4caa-b9f7-c69247872344/btw21_erl_sitzzuteilung.pdf',
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
      ],
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
          'The model starts from 598 base seats and keeps the historical state seat contingents fixed. Every winner in a non-empty constituency receives a direct seat. Overhang and compensatory seats can enlarge parliament, and up to three overhang seats may remain uncompensated. If a state contributes no votes, it creates no provisional party seats or minimum-seat claims in this simulation, while the nationwide allocation still starts from at least 598 seats.',
        dataSources:
          'Prepared 2021 first- and second-vote data, party qualification metadata, and the committed 2021 state-seat-contingent fixture.',
        limitations:
          'A completely inactive state is not a normal case defined by the historical law; its treatment is an explicit simulation convention. Empty constituencies do not reduce the 598-seat base. Candidate names, state-list order, and person-level mandate assignment are not modeled.',
      },
      'de-2023-fixed-630': {
        name: 'Electoral law reformed in 2023',
        shortName: '2023 reform',
        description:
          "Seat allocation under the electoral law reformed in 2023, with a fixed size of 630 seats. A constituency win becomes a direct seat only when covered by the party's second-vote allocation.",
        rules:
          'Exactly 630 seats are allocated by second votes. Constituency wins count as direct seats only to the extent that the party has sufficient seats in the relevant state allocation; remaining wins are reported as uncovered. A constituency without first votes has no winner but does not reduce parliament. An excluded state receives no seats when its lists have no votes, and the remaining votes still fill all 630 seats.',
        dataSources:
          'Prepared 2021 first- and second-vote data and party qualification metadata. The historical state-seat-contingent fixture is not used by this model.',
        limitations:
          'The result is aggregate by party and state. It does not determine which individual constituency winners are covered or assign list seats to candidates. The model applies the Federal Constitutional Court’s transitional three-constituency rule.',
      },
      'union-parallel': {
        name: 'Parallel 299 + 299 model',
        shortName: 'Parallel 299+299',
        description:
          'Parallel voting with two independent tiers: up to 299 direct seats from constituencies and exactly 299 list seats allocated by second votes.',
        rules:
          'Every non-empty constituency contributes one direct seat independently of the list tier. A separate pool of exactly 299 list seats is allocated by second votes. An empty constituency contributes no direct seat; that seat is neither reassigned nor converted into a list seat. The actual parliament size is therefore the number of allocated direct seats plus 299.',
        dataSources:
          'Prepared 2021 first- and second-vote data and party qualification metadata. No historical state-seat-contingent fixture is used.',
        limitations:
          'The model is a project-defined comparison scenario rather than enacted federal electoral law. Candidate names and list-order assignment remain outside the product scope. Because empty constituencies reduce the actual total, the majority threshold may be lower than 300 seats.',
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
    title: 'Transparenz der Berechnung',
    label: 'Transparenz:',
    text:
      'Alle Berechnungen laufen vollständig in deinem Browser. Trotz automatisierter Tests können Fehler in Formeln oder Umsetzung die Ergebnisse verfälschen. Die Resultate sind Simulationen, keine amtlichen Berechnungen.',
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
      title: 'Methodik und Daten',
      close: 'Methodik schließen',
      activeModel: 'Aktives Modell',
      introduction:
        'Die Anwendung berechnet dasselbe gefilterte Stimmenszenario der Bundestagswahl 2021 mit drei Wahlsystemen neu. Die Ergebnisse sind transparente politische Simulationen, keine amtlichen Wahlergebnisse, Prognosen oder Wahlempfehlungen.',
      scenarioTitle: 'So werden Filter verstanden',
      scenarioAssumptions: [
        'Filter entfernen die passenden Erst- und Zweitstimmen. Sie verändern weder die Bevölkerung noch die 16 Bundesländer, die 299 Wahlkreise, deren Grenzen oder die institutionelle Ausgangsgröße eines Wahlsystems.',
        'Ein Bundesland auszuschließen bedeutet, dass keine Stimmen aus diesem Land gezählt werden. Das Land bleibt Teil Deutschlands und behält seine Wahlkreise.',
        'Ein Wahlkreis ohne einbezogene Erststimmen hat keinen Gewinner. Die Anwendung erzeugt niemals einen Gewinner durch alphabetische Reihenfolge, Partei-ID oder Zufall.',
        'Ein exakter positiver Erststimmengleichstand wird nach einer stabilen Parteireihenfolge aufgelöst, damit wiederholte Berechnungen identisch bleiben. Das ist eine Simulationsregel und kein rechtlich vorgesehener Losentscheid.',
        'Das Ergebnis wird nach Parteien zusammengefasst. Kandidatennamen, Listenplätze und personengenaue Mandatszuweisungen werden nicht berechnet.',
      ],
      dataPreparationTitle: 'So werden die Stimmdaten aufbereitet',
      dataPreparationItems: [
        'Die amtlichen Wahlkreissummen von 2021 nach Partei, Stimmenart und Brief- oder Urnenwahl bleiben unverändert.',
        'Die Quelle veröffentlicht nicht die vollständige Kombination aus Wahlkreis, Partei, Erst- oder Zweitstimme, Alter, Geschlechtskategorie und Wahlart. Die demografischen Details werden deshalb aus veröffentlichten Aggregaten geschätzt.',
        'Die repräsentative Wahlstatistik wird als Anteilsverteilung verwendet und an die exakten amtlichen Summen angepasst. Die resultierenden Werte sind gebrochene Stimmengewichte und keine einzelnen Stimmzettel.',
        'Für eine Partei und Wahlart erhalten derzeit alle Wahlkreise eines Bundeslands dasselbe angepasste demografische Profil. Parteien ohne eigenes veröffentlichtes Profil verwenden das Landesprofil „Sonstige“ oder als letzte Rückfallregel eine Gleichverteilung.',
        'Die veröffentlichte Kategorie „männlich“ enthält laut Quellenhinweis auch Personen mit dem Eintrag divers oder ohne Geschlechtseintrag im Geburtenregister. Die Anwendung übernimmt die Quellenkategorien und deutet sie nicht um.',
      ],
      systemsTitle: 'Verglichene Wahlsysteme',
      summary: (modelName: string) => `Methodik für ${modelName}`,
      rules: 'Regeln und Annahmen',
      dataSources: 'Vom Modell verwendete Daten',
      limitations: 'Grenzen und Sonderfälle',
      modelNotes: 'Hinweise zum aktiven Ergebnis',
      majorityTitle: 'Mehrheiten',
      majorityText:
        'Die absolute Mehrheit wird immer aus dem tatsächlich berechneten Parlament bestimmt: abgerundet(Gesamtsitze ÷ 2) + 1. Sie ist nicht als feste Zahl hinterlegt.',
      calculationTitle: 'Berechnung und mögliche Fehler',
      calculationText:
        'Alle Filterungen und Sitzberechnungen finden im Browser statt. Es können Rechenfehler, falsch umgesetzte Regeln oder übersehene Sonderfälle enthalten sein und Ergebnisse verfälschen.',
      historicalSeatGrowthTitle: 'Hinweis zu der Sitzbelegung und -anzahl',
      historicalSeatGrowthParagraphs: [
        'Beim Experimentieren mit den Filtern kann es passieren, dass die Anzahl der Sitze im Bundestag förmlich explodiert. Meiner Einschätzung nach liegt das an den Überhangsmandaten in Zusammenhang mit den gewonnen Wahlkreisen. Da durch das alte Berechnungssystem Direktmandate immer in den Bundestag können müssen, müssen die anderen Parteien mehr Mandate als Ausgleich bekommen.',
        'Siege pro Wahlkreis begünstigen allerdings viele knappe Vorsprünge. Wenn eine Partei generell wenig Zweitstimmen in wenigen Gebieten bekommt, bundesweit aber stabil ist, kann sich der knappe Vorsprung sozusagen "hochsummieren".',
        'Ich will natürlich auch nicht ausschließen, dass die Berechnungen im Hintergrund falsch sind. Da greifen viele komplexe Dinge ineinander.',
      ],
      sourcesTitle: 'Quellen',
      sourcesIntroduction:
        'Die aufbereiteten Anwendungsdateien beruhen auf den folgenden amtlichen Veröffentlichungen. Die einzelnen Umformungs- und Prüfschritte sind zusätzlich in den Notebooks und der Dokumentation zur Datenaufbereitung festgehalten.',
      sources: [
        {
          label: 'Amtliche Ergebnisse der Bundestagswahl 2021',
          description:
            'Ergebnisse nach Wahlkreisen und Bundesländern, herunterladbare Ergebnistabellen und das bestätigte Bundesergebnis.',
          href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse.html',
        },
        {
          label: 'Repräsentative Wahlstatistik 2021',
          description:
            'Veröffentlichte Stimmabgabe nach Geschlechtskategorie, Altersgruppe sowie Brief- und Urnenwahl.',
          href: 'https://www.bundeswahlleiterin.de/bundestagswahlen/2021/ergebnisse/repraesentative-wahlstatistik.html',
        },
        {
          label: 'Sitzkontingente der Länder 2021',
          description:
            'Historische Verteilung der 598 Ausgangssitze auf die Bundesländer für das Modell des Wahlrechts 2021.',
          href: 'https://www.bundeswahlleiterin.de/mitteilungen/bundestagswahlen/2021/20210909_btw21-sitzkontingente.html',
        },
        {
          label: 'Erläuterung der Sitzverteilung 2021',
          description:
            'Amtliche Beispielrechnung des historischen Verfahrens einschließlich Überhang- und Ausgleichsmandaten.',
          href: 'https://www.bundeswahlleiterin.de/dam/jcr/e9eb08cc-e19e-4caa-b9f7-c69247872344/btw21_erl_sitzzuteilung.pdf',
        },
        {
          label: 'Bundeswahlgesetz',
          description:
            'Aktuelle konsolidierte Fassung des Bundeswahlgesetzes mit 630-Sitze-Verteilung und Zweitstimmendeckung.',
          href: 'https://www.gesetze-im-internet.de/bwahlg/',
        },
        {
          label: 'Urteil des Bundesverfassungsgerichts vom 30. Juli 2024',
          description:
            'Entscheidung zur Reform von 2023 und zur übergangsweisen Fortgeltung der Drei-Wahlkreis-Regel.',
          href: 'https://www.bundesverfassungsgericht.de/SharedDocs/Entscheidungen/DE/2024/07/fs20240730_2bvf000123.html',
        },
      ],
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
          'Das Modell beginnt mit 598 Ausgangssitzen und hält die historischen Sitzkontingente der Länder fest. Jeder Gewinner eines nicht leeren Wahlkreises erhält ein Direktmandat. Überhang- und Ausgleichsmandate können den Bundestag vergrößern; bis zu drei Überhangmandate können unausgeglichen bleiben. Liefert ein Land keine Stimmen, erzeugt es in dieser Simulation keine vorläufigen Parteisitze oder Mindestsitzansprüche, während die bundesweite Verteilung weiterhin bei mindestens 598 Sitzen beginnt.',
        dataSources:
          'Aufbereitete Erst- und Zweitstimmen der Bundestagswahl 2021, Metadaten zur Parteizulassung und die hinterlegte Datei mit den Sitzkontingenten der Länder für 2021.',
        limitations:
          'Ein vollständig inaktives Bundesland ist kein normaler Fall des historischen Wahlrechts; seine Behandlung ist eine ausdrücklich festgelegte Simulationsregel. Leere Wahlkreise verkleinern die Ausgangsgröße von 598 Sitzen nicht. Kandidatennamen, Landeslistenreihenfolge und personengenaue Mandatszuweisung werden nicht modelliert.',
      },
      'de-2023-fixed-630': {
        name: '2023 reformiertes Wahlrecht',
        shortName: 'Reform 2023',
        description:
          'Sitzverteilung nach dem 2023 reformierten Wahlrecht mit einer festen Größe von 630 Sitzen. Ein Wahlkreissieg führt nur bei ausreichender Zweitstimmendeckung zu einem Direktmandat.',
        rules:
          'Genau 630 Sitze werden anhand der Zweitstimmen verteilt. Wahlkreissiege zählen nur insoweit als Direktmandate, wie die Partei in der jeweiligen Landesverteilung genügend Sitze erhält; übrige Siege werden als nicht gedeckt ausgewiesen. Ein Wahlkreis ohne Erststimmen hat keinen Gewinner, verkleinert den Bundestag aber nicht. Ein ausgeschlossenes Bundesland erhält bei stimmlosen Landeslisten keine Sitze; die übrigen Stimmen besetzen dennoch alle 630 Sitze.',
        dataSources:
          'Aufbereitete Erst- und Zweitstimmen der Bundestagswahl 2021 und Metadaten zur Parteizulassung. Die historischen Sitzkontingente der Länder werden in diesem Modell nicht verwendet.',
        limitations:
          'Das Ergebnis bleibt auf Parteien und Länder aggregiert. Es bestimmt nicht, welche einzelnen Wahlkreisgewinner gedeckt sind, und weist keine Listenplätze Personen zu. Das Modell berücksichtigt die übergangsweise Drei-Wahlkreis-Regel des Bundesverfassungsgerichts.',
      },
      'union-parallel': {
        name: 'Grabenwahl 299 + 299',
        shortName: 'Grabenwahl 299+299',
        description:
          'Grabenwahl mit zwei unabhängigen Blöcken: bis zu 299 Direktmandate aus den Wahlkreisen und genau 299 Listenmandate nach Zweitstimmen.',
        rules:
          'Jeder nicht leere Wahlkreis liefert unabhängig von der Listenebene ein Direktmandat. Ein eigener Block von genau 299 Listenmandaten wird nach Zweitstimmen verteilt. Ein leerer Wahlkreis liefert kein Direktmandat; dieser Sitz wird weder neu vergeben noch in ein Listenmandat umgewandelt. Die tatsächliche Parlamentsgröße ist deshalb die Zahl der vergebenen Direktmandate plus 299.',
        dataSources:
          'Aufbereitete Erst- und Zweitstimmen der Bundestagswahl 2021 und Metadaten zur Parteizulassung. Historische Sitzkontingente der Länder werden nicht verwendet.',
        limitations:
          'Das Modell ist ein projektspezifisches Vergleichsszenario und kein geltendes Bundeswahlrecht. Kandidatennamen und die Zuweisung nach Listenreihenfolge bleiben außerhalb des Produktumfangs. Da leere Wahlkreise die tatsächliche Sitzanzahl verkleinern, kann die Mehrheitsschwelle unter 300 Sitzen liegen.',
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
