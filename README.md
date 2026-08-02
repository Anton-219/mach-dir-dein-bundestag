# Mach dir deinen Bundestag

An interactive React and TypeScript application for exploring how selected voter groups could change the composition of the German Bundestag.

The application uses prepared data for the 2021 German federal election. Users can include or exclude federal states, age groups, genders represented by the source data, and postal or in-person votes. Party results, the parliamentary seat distribution, and minimal winning coalitions update immediately inside one connected desktop analysis workspace.

The application is an educational analysis tool. Filtered results are hypothetical scenarios, not forecasts or voting recommendations.

## Requirements

- Node.js 20.19 or newer, or Node.js 22.12 or newer
- npm

## Development

Run all commands from the repository root.

```bash
npm ci
npm run dev
```

The Vite development server opens the single frontend application.

## Validation

```bash
npm audit
npm test
npm run lint
npm run build
```

`npm run build` performs the TypeScript project build and creates the production bundle in `dist/`.

## Application structure

- `src/components/analysis-workspace/` contains the connected filters, Germany map, parliament result, party summaries, demographic context, and coalition presentation.
- `src/lib/` contains framework-independent filter, election, map, result, and coalition logic.
- `src/models/` contains the preserved JSON compatibility contracts and calculated result models.
- `src/data/loaders.ts` loads and validates the static application data.
- `tests/unit/` contains calculation, filter, presentation, map, and regional-result tests.

The project uses one application entry point and no backend, router, database, account system, or persistence layer.

## Static data

The primary application loads these same-origin assets from `public/data/`:

- `partyData.json`: party names, abbreviations, colours, and parliamentary positions
- `second_votes.json`: second-vote records used by the scenario calculation
- `stat_votes.json`: demographic reference vote records
- `election_results_direktmandate.json`: direct-mandate totals by party
- `germany_states_map.geo.json`: federal-state geometry for the interactive map

The JSON-facing field names and literal values in `src/models/json-contracts.ts` are compatibility contracts. They must not be changed without migrating the corresponding data files.

The final 24 SSW entries in the current `second_votes.json` source contain a known legacy `voteType` defect. The loader narrowly normalizes those application-facing records to second votes while leaving the committed JSON unchanged. The data-preparation source should eventually correct this at generation time.

## Calculation scope

The application aggregates included second votes, applies the documented party-qualification assumptions, distributes a fixed 630 seats through the current odd-divisor implementation, and enumerates minimal winning coalitions. CDU and CSU remain separate in party and parliament results and are normalized to `CDU+CSU` for coalition enumeration.

These calculations reproduce the agreed reference behavior of the former prototype. Known methodological and electoral-law assumptions are documented beside the domain modules and in the project vision.

## Data preparation and methodology

Python and Jupyter sources under `scripts/` prepare the election datasets outside the React application. Some demographic values are modelled from differently aggregated source tables and must not be interpreted as individual-level observations.

See [`docs/PROJECT_VISION.md`](docs/PROJECT_VISION.md) for the product scope, transparency requirements, technical principles, and known methodological limitations. More detailed source disclosure and methodology presentation remain tracked separately from this repository cut-over.

## Repository history

The former root prototype and the temporary `app-v2` rebuild workspace were removed from the active tree during the final cut-over. Their complete implementation history remains available through Git.
