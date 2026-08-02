# Project Vision: Build Your Own Bundestag

## Background

“Build Your Own Bundestag” began as a learning and experimentation project. It combines three goals:

1. gain practical experience with React and TypeScript,
2. explore how LLMs can support product design and software development,
3. make political election data interactive and easier to understand.

The existing prototype can already filter election data, calculate a seat distribution, visualize a Bundestag, and display possible majority coalitions. However, the current application should not be considered a finished product. Data delivery, domain validation, code quality, and especially the user interface still need substantial improvement.

This document describes the shared target state for future development. It should guide product decisions, UI design, refactoring, and implementation work.

## Project Language

English is the default language of the project.

This applies to:

- source code identifiers,
- code comments,
- documentation,
- commit messages and pull request descriptions,
- issue descriptions,
- UI copy and user-facing explanations,
- test names and developer tooling output where the project controls the wording.

German localization may be added later, but it is not part of the first revised version. Proper names and official German terms may remain unchanged where translating them would reduce accuracy, for example “Bundestag” or official state names in source data.

## Product Idea

The application allows users to explore an election result from different social, demographic, and geographic perspectives.

The starting point is real election data. By including or excluding selected groups, users can examine how the Bundestag might be composed if only certain parts of the electorate were considered.

Examples:

- What would the Bundestag look like if only people under the age of 35 had voted?
- How would the seat distribution change without selected federal states?
- What differences appear between postal voting and in-person voting?
- How do results differ between men and women in specific age groups?
- Which coalitions would have a majority in a filtered scenario?

The application is not an election forecasting tool and must not provide political recommendations. It is an interactive analysis and learning tool intended to make patterns and relationships visible.

## Core Product Promise

> Users can create their own election scenario through a small number of understandable interactions and immediately see how it affects vote shares, seat distribution, and possible parliamentary majorities.

The application should combine three qualities:

- **understandable:** People should be able to use it without prior knowledge of electoral law or data analysis.
- **immediate:** Filter changes should have a direct and visible effect on the result.
- **transparent:** The data basis, assumptions, calculation rules, and limitations must be clearly explained.

## Target Audience

The application is primarily intended for:

- people interested in exploring election results,
- pupils, students, teachers, and educators,
- people who want to understand regional and demographic differences,
- developers who use the project as an example of a data-driven React application,
- the project owner, using the codebase as a learning environment for TypeScript, UI architecture, and responsible LLM-assisted development.

The application is not intended to replace professional election-research software. It should nevertheless remain plausible, reproducible, and honest about its limitations.

## Desired User Experience

When users open the application, they should immediately understand:

- what they can explore,
- which data is currently included,
- how filters can be changed,
- what result is produced,
- how that result should be interpreted.

The main interaction should take place in one coherent analysis workspace rather than across a sequence of separate content sections. On common desktop viewports, the parliament result, filters, Germany map, party summary, and coalition options should be immediately visible together. Users should be able to change a scenario and observe the connected results without navigating or scrolling between the main tools.

The relative size and visual emphasis of these areas remain open design decisions that should be evaluated in the working application. The project vision defines which elements belong together and should be readily available, but it does not prescribe a fixed grid or a single dominant component.

## Core User Flow

### 1. Initial Scenario

When the application starts, it displays the complete underlying election result. The following information should be visible:

- election year,
- vote type used,
- data source,
- electoral law or calculation model used,
- total number of votes included,
- status indicating an unfiltered result.

### 2. Apply Filters

Users can include or exclude groups through a clear filter interface.

Planned filter dimensions:

- federal state,
- age or age group,
- gender as represented by the available data,
- postal voting or in-person voting,
- additional dimensions later, provided reliable data is available.

Every interaction must clearly communicate whether a group is included or excluded. Excluded groups must not be indicated only through a difficult-to-interpret color change.

### 3. Review the Active Scenario

All active filters should be summarized in readable language, for example:

- “Bavaria excluded”
- “Ages 18–24 included”
- “Postal voting only”

Users can remove individual filters directly. A central “Reset all filters” action must also be available.

The application should show how many votes, or what share of the original dataset, remains included in the current scenario.

### 4. Explore the Result

After every change, at least the following results should be updated:

- party vote shares,
- seat distribution,
- total number of seats,
- majority threshold,
- possible minimal winning coalitions.

Transitions should be calm and easy to follow. The layout must not jump unexpectedly, and excessive animation should be avoided.

## Information Architecture and UI Target State

### Header

The header should contain:

- project title,
- a one-sentence explanation,
- election year and data status,
- an easy-to-find link to methodology and data sources.

### Desktop Analysis Workspace

On common desktop viewports, the following areas should form one immediately visible analysis workspace:

- the Bundestag seat distribution,
- filter controls,
- the Germany map,
- a compact party result summary,
- coalition options,
- the active scenario and relevant data status.

These areas should read as parts of one connected tool rather than as a long-form sequence of independent sections. Their exact arrangement, size, and visual priority are intentionally not fixed by this document. The layout should be tested with real components and adjusted based on clarity, available space, and ease of comparison.

Supporting explanations and detailed methodology do not need to compete for space inside the main workspace. They should remain easy to reach elsewhere in the same application.

### Parliament and Party Results

The Bundestag seat distribution and party summary are connected views of the current result. They should be clearly labelled, easy to interpret, and available without leaving the analysis workspace.

Supporting information should include:

- party,
- number of seats,
- vote share,
- change compared with the unfiltered baseline,
- majority marker.

The result must remain understandable without relying exclusively on party colors. Colors should provide sufficient contrast and be used accessibly.

### Filter Area and Germany Map

Filters should be part of the shared analysis workspace and grouped into understandable categories:

- region,
- age and gender,
- voting method.

The Germany map should remain available as a visual selection tool, but it must be supported by labels, a legend, and an accessible alternative list of federal states.

The age and gender chart may remain as an interactive filter if selection states are clear, keyboard-accessible, and understandable. A conventional form-based alternative should also be available.

### Coalition Area

Coalition options should be available within the same desktop analysis workspace so that they can be compared directly with the current result. The interface should not display every mathematically possible combination without structure. Instead, results should be prioritised and easy to compare.

At minimum, each coalition should display:

- participating parties,
- combined number of seats,
- distance from the majority threshold,
- graphical composition,
- whether it is a minimal winning coalition.

CDU and CSU may be treated as a combined parliamentary union in coalition views while the underlying seat data remains transparent.

## Functional Scope

### Vote Aggregation

The application aggregates all vote records that match the active filters. Party results and vote shares are calculated from those aggregated votes.

The calculation must also handle:

- no active filters,
- very small remaining datasets,
- all data being filtered out,
- parties with no votes in the current scenario,
- unknown or unmapped party entries.

### Seat Calculation

Seat allocation should be implemented in an independent, testable domain module. UI components must not implement the calculation logic themselves.

The module must explicitly document:

- the number of seats to distribute,
- the allocation method,
- the electoral threshold,
- treatment of direct mandates,
- treatment of parties representing national minorities,
- treatment of CDU and CSU,
- rounding and tie-breaking behavior.

The goal is not merely a visually plausible result. Defined reference datasets must produce reproducible and domain-validated outcomes.

### Coalition Calculation

Coalition logic should be separated from presentation and protected by automated tests.

By default, the application should calculate minimal winning coalitions. A coalition is minimal when it reaches a majority, but removing any participating party would cause it to lose that majority.

The results should:

- contain no duplicates,
- use stable ordering,
- use a clearly defined majority threshold,
- optionally be sortable by number of parties or size of the majority.

## Data Basis

The application is based on prepared election data. Data preparation takes place outside the React application, currently through Python and Jupyter notebooks.

The long-term goal is a reproducible data pipeline:

1. obtain raw data from documented official sources,
2. transform the data into a clearly defined internal format,
3. validate consistency and totals,
4. generate the files required by the application,
5. either version the generated data or make it reproducibly available during the build process.

The application must not depend on files that exist only on one local computer and need to be copied manually.

For every data file, the project should document its origin, election year, generation process, and known limitations.

### Handling Incomplete Demographic Data

If votes must be distributed or estimated across demographic groups, this must be clearly identified as modelling. Estimated values must not be presented as exact individual-level observations.

Methodological assumptions belong on a dedicated methodology page and in the developer documentation.

## Technical Target State

### Core Principles

The codebase should remain understandable as a learning project. Abstractions should be introduced where they improve clarity, not to create unnecessary architectural complexity.

Important principles:

- domain logic in pure TypeScript modules,
- UI components with clearly limited responsibilities,
- serializable filter state instead of stored callback functions,
- derived values calculated where possible instead of stored redundantly,
- strong typing without avoidable `any`,
- meaningful names and small, testable functions,
- no production debug logging,
- documented data contracts.

### Suggested Domain Areas

A possible structure is:

- `domain/election`: election data, aggregation, and result types,
- `domain/filters`: filter definitions and filter evaluation,
- `domain/parliament`: seat allocation and majority calculations,
- `data`: loading and validating prepared data,
- `features/filters`: filter UI,
- `features/results`: parliament, parties, and result comparison,
- `features/coalitions`: coalition presentation,
- `shared`: reusable UI and utility functions.

This structure is a guideline rather than a strict requirement. The essential goal is a clear separation between data, domain logic, and presentation.

### Filter Model

Filters should be represented as data, for example:

```ts
interface ElectionFilter {
  dimension: "state" | "ageGroup" | "gender" | "electionMethod";
  mode: "include" | "exclude";
  values: string[];
}
```

This enables:

- readable display of active filters,
- shareable scenarios through URLs,
- saving and restoring filters,
- testing without the UI,
- clearer future analytics and telemetry.

## Design and Visual Language

The revised UI should feel modern, calm, and focused on the content. It should not resemble a generic Bootstrap dashboard or an overloaded news graphic.

### Design Principles

- a coherent desktop analysis workspace,
- clear visual hierarchy without prescribing a single dominant area,
- purposeful spacing that supports information density without clutter,
- readable typography,
- neutral base colors with purposeful use of party colors,
- consistent components and interaction states,
- clear English labels,
- a desktop-first layout that can be adapted to tablet and mobile after the main workspace is stable,
- accessible controls and sufficient contrast.

### Interaction Principles

- selection states are explicitly labelled,
- every action provides visible feedback,
- filters work with mouse, keyboard, and touch,
- charts are not the only source of information,
- tooltips add detail but do not replace labels,
- empty or invalid scenarios are explained,
- resetting and returning to the baseline is always possible.

## Transparency and Context

Political data requires particularly clear context. The application should visibly explain:

- that filtered results are hypothetical scenarios,
- that demographic data may be modelled or aggregated depending on the source,
- which election year is displayed,
- which electoral rules are modelled,
- why results may differ from official seat distributions,
- that the application is neither a forecast nor a voting recommendation.

A dedicated “Methodology and Data” section should make this information available in detail.

## Accessibility

The application should meet fundamental accessibility requirements for web applications:

- semantic heading structure,
- complete keyboard operation,
- visible focus states,
- meaningful alternative text and descriptions for graphics,
- sufficient color contrast,
- no information communicated through color alone,
- understandable form controls and labels,
- support for reduced motion,
- a component structure that can be adapted for high zoom levels and small viewports without rewriting the core workspace.

## Quality and Traceability

### Tests

At minimum, automated tests should cover:

- combinations of multiple filters,
- vote aggregation,
- percentage calculation,
- seat allocation for known reference cases,
- electoral thresholds and exemptions,
- total seat count,
- minimal winning coalitions,
- CDU/CSU merging,
- behavior for empty results,
- data validation.

### Automated Checks

For every pull request, the project should run at least:

- TypeScript build,
- linting,
- unit tests.

A fresh checkout must be installable and buildable without special files that exist only on a developer’s machine.

### Documentation

The README should eventually include at least:

- project purpose,
- screenshots or a short product overview,
- local setup,
- data provisioning,
- available scripts,
- architecture overview,
- domain assumptions,
- known limitations.

## Non-Goals for the First Revised Version

The first stable revision should remain deliberately limited. It does not initially require:

- real-time forecasts or polling data,
- personalised voting advice,
- simulation of strategic voting,
- user accounts,
- permanent server-side storage of personal scenarios,
- a custom backend if static data is sufficient,
- fully featured academic election-research software,
- support for an arbitrary number of election years before the first data model is stable,
- complete smartphone layout refinement before the desktop analysis workspace is established.

## Definition of a Successful First Stable Version

The first stable version is complete when:

1. a fresh checkout can be reproducibly installed and built,
2. the data source and preparation process are documented,
3. the unfiltered reference result is calculated transparently,
4. central electoral rules are protected by automated tests,
5. federal state, age, gender, and voting method can be filtered clearly,
6. active filters are unambiguous and can be fully reset,
7. seat distribution and minimal winning coalitions update correctly,
8. the main analysis workspace is clear and usable on common desktop viewports,
9. all primary project and UI language is consistently English,
10. methodology, assumptions, and limitations are accessible within the application.

## Recommended Development Phases

### Phase 1: Stabilize the Project

- clarify missing or generated data files,
- establish a reproducible build,
- fix obvious TypeScript and runtime errors,
- remove debug code,
- protect existing domain logic with reference tests.

### Phase 2: Structure the Domain Model and Code

- represent filters as serializable data,
- move aggregation, seat allocation, and coalition logic out of UI components,
- define and validate data contracts,
- simplify derived state.

### Phase 3: Redesign the UI and User Journey

- define the information architecture,
- establish a visual design system,
- implement and validate the common desktop analysis workspace,
- make filter states and result comparisons understandable,
- keep core UI areas in components with clearly limited responsibilities,
- adapt the established workspace to tablet and mobile after the desktop baseline is stable,
- include accessibility from the beginning.

### Phase 4: Documentation and Release

- complete the methodology page and README,
- configure continuous integration,
- configure static deployment,
- document known limitations,
- publish the first stable version.

## Open Product Decisions

Several questions still need explicit decisions before or during implementation:

- Should the first version cover only the 2021 German federal election?
- Which electoral rules are the reference, and how should they be named?
- Should filters be understood as inclusion or exclusion by default?
- Which demographic values are exact, and which are modelled?
- Should results always be compared with the complete baseline result?
- Should the application show only minimal winning coalitions or optionally all majorities?
- Should generated JSON files be committed, or generated reproducibly during the build?
- How should space and visual emphasis be distributed among the parliament result, filters, Germany map, party summary, and coalition options?
- Which explanations belong directly in the main interface, and which belong on the methodology page?

These decisions should be documented so that domain behavior and UI design do not emerge accidentally from implementation details.

## Guiding Principle for Future Development

The project should retain its character as a learning and experimentation project while progressing from a technically functional prototype to an understandable, reproducible, and trustworthy application.

New features are valuable only when existing functionality is clear to use, transparent in its assumptions, and technically maintainable. Future development should therefore prioritize stability, clarity, and a convincing user experience.
