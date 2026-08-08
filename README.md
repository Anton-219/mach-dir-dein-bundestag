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
- `src/models/` contains the prepared JSON contracts and calculated result models.
- `src/data/loaders.ts` loads and validates the static application data.
- `tests/unit/` contains calculation, filter, presentation, map, and regional-result tests.

The project uses one application entry point and no backend, router, database, account system, or persistence layer.

## Static data

The primary application loads these same-origin assets from `public/data/`:

- `partyData.json`: party names, abbreviations, colours, and parliamentary positions
- `btw2021/first_votes.json`: constituency-aware first-vote records used to calculate district winners
- `btw2021/second_votes.json`: constituency-aware second-vote records used by the scenario calculation and the demographic presentation
- `germany_states_map.geo.json`: federal-state geometry for the interactive map

The JSON-facing field names and literal values in `src/models/json-contracts.ts` are application data contracts. They must not be changed without migrating the corresponding prepared data files.

## Calculation scope

The application applies the active scenario filters separately to first and second votes. Filtered second votes determine party results and the national seat allocation. Filtered first votes are aggregated by constituency and party to determine district winners for the three-direct-mandate qualification rule.

An exact tie in a constituency is left without a winner by the default resolver. That exceptional rule is isolated in its own function so it can be replaced later without changing the surrounding calculation.

The SSW is represented as a party exempt from the general vote-share threshold. It participates in the same seat allocation as every other qualified party, so the allocation itself determines whether its second-vote total is sufficient for a seat; there is no separate hard-coded minimum-vote constant.

The application distributes a fixed 630 seats through the current odd-divisor implementation and enumerates minimal winning coalitions. CDU and CSU remain separate in party and parliament results and are normalized to `CDU+CSU` for coalition enumeration.

These calculations reproduce the agreed reference behavior of the former prototype while replacing its static direct-mandate totals with scenario-specific constituency results. Known methodological and electoral-law assumptions are documented beside the domain modules and in the project vision.

## Data preparation and methodology

Python and Jupyter sources under `scripts/` prepare the election datasets outside the React application. Some demographic values are modelled from differently aggregated source tables and must not be interpreted as individual-level observations.

The primary workflow lives in `scripts/notebooks/btw2021/`. See `scripts/README.md` for inputs, methodology, generated files, validation, and known limitations.

See [`docs/PROJECT_VISION.md`](docs/PROJECT_VISION.md) for the product scope, transparency requirements, technical principles, and known methodological limitations. More detailed source disclosure and methodology presentation remain tracked separately from this repository cut-over.

## License and third-party material

The application's own source code is licensed under the [MIT License](LICENSE), unless otherwise noted.

Election data, geographic data, prepared or derived datasets, and other third-party material are not relicensed under the repository's MIT License. They remain subject to their respective source licences, attribution requirements, and notices. See [`Licenses/sources-and-licenses.md`](Licenses/sources-and-licenses.md) for the data sources and applicable licence information.

Production builds also generate `dist/third-party-licenses.md`, containing licence information for dependencies bundled by Vite.

## Repository history

The former root prototype and the temporary `app-v2` rebuild workspace were removed from the active tree during the final cut-over. Their complete implementation history remains available through Git.
