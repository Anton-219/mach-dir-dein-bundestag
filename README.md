# Mach dir deinen Bundestag

An interactive React and TypeScript application for exploring how selected voter groups could change the composition of the German Bundestag.

The application uses prepared data for the 2021 and 2025 German federal elections. Users can include or exclude federal states, age groups, genders represented by the source data, and postal or in-person votes. Party results, the parliamentary seat distribution, and minimal winning coalitions update immediately inside one connected desktop analysis workspace.

The application is an educational analysis tool. Filtered results are hypothetical scenarios, not forecasts or voting recommendations.

## Requirements

For normal frontend development:

- Node.js 20.19 or newer, or Node.js 22.12 or newer
- npm

Python 3, Jupyter and the notebook dependencies are only required when the election data itself is regenerated.

## Development

Run all commands from the repository root.

```bash
npm ci
npm run dev
```

The Vite development server uses the committed binary election assets under `public/data/`. It does not execute Python or Jupyter.

## Validation

```bash
npm audit
npm test
python -m scripts.run_tests
npm run lint
npm run build
```

`npm run build` performs the TypeScript project build and creates the production bundle in `dist/`. It uses the same committed binary election assets as local development.

## Application structure

- `src/components/analysis-workspace/` contains the connected filters, Germany map, parliament result, party summaries, demographic context, and coalition presentation.
- `src/lib/` contains framework-independent filter, election, map, result, coalition, and binary-data logic.
- `src/models/` contains the prepared JSON contracts and calculated result models.
- `src/data/loaders.ts` loads and validates the static application data.
- `tests/unit/` contains calculation, filter, presentation, map, regional-result, and binary-format tests.

The project uses one application entry point and no backend, router, database, account system, or persistence layer.

## Static data

The application loads committed same-origin runtime assets from `public/data/`:

- `partyData.json`: party names, abbreviations, colours, and parliamentary positions
- `btw2021/vote_data.json`, `btw2021/first_votes.bin`, and `btw2021/second_votes.bin`: compact 2021 vote metadata and columns
- `btw2025/vote_data.json`, `btw2025/first_votes.bin`, and `btw2025/second_votes.bin`: compact 2025 vote metadata and columns
- `germany_states_map.geo.json`: federal-state geometry for the interactive map

The large human-readable `VoteEntry` JSON files are not runtime assets and are not committed. The notebooks create them locally under `scripts/data/generated/btw2021/` and `scripts/data/generated/btw2025/`. `scripts/export_vote_binary.py` converts those files into the committed runtime assets under `public/data/`.

The JSON-facing field names and literal values in `src/models/json-contracts.ts` remain the prepared data contract. They must not be changed without migrating the notebook output and binary exporter. See [`docs/BINARY_VOTE_DATA.md`](docs/BINARY_VOTE_DATA.md) for the runtime format.

## Regenerating election data

Election-data preparation is an explicit maintenance operation and is deliberately not part of `npm run dev` or `npm run build`.

Download the official source files and place them at the documented paths under `scripts/data/`. The current default paths are:

```text
scripts/data/btw21_wbz_ergebnisse.csv
scripts/data/btw21_rws_bst2.csv
scripts/data/btw25_wbz_ergebnisse.csv
scripts/data/btw25_rws_bst2.csv
```

Then either run the complete preparation:

```bash
npm run prepare:election-data
```

or run its two stages separately:

```bash
npm run prepare:vote-json
npm run prepare:vote-data
```

`prepare:vote-json` executes the 2021 and 2025 preparation and validation notebooks through Jupyter without overwriting the committed notebook cell outputs. It writes the large gitignored JSON files under `scripts/data/generated/<election>/`.

`prepare:vote-data` converts those JSON files into `first_votes.bin`, `second_votes.bin`, and `vote_data.json` under `public/data/<election>/`. Those compact runtime files should be reviewed and committed when the election data changes.

## Calculation scope

The application applies the active scenario filters separately to first and second votes. Filtered second votes determine party results and the national seat allocation. Filtered first votes are aggregated by constituency and party to determine district winners for the three-direct-mandate qualification rule.

An exact tie in a constituency is left without a winner by the default resolver. That exceptional rule is isolated in its own function so it can be replaced later without changing the surrounding calculation.

The SSW is represented as a party exempt from the general vote-share threshold. It participates in the same seat allocation as every other qualified party, so the allocation itself determines whether its second-vote total is sufficient for a seat; there is no separate hard-coded minimum-vote constant.

The application distributes a fixed 630 seats through the current odd-divisor implementation and enumerates minimal winning coalitions. CDU and CSU remain separate in party and parliament results and are normalized to `CDU+CSU` for coalition enumeration.

These calculations reproduce the agreed reference behavior of the former prototype while replacing its static direct-mandate totals with scenario-specific constituency results. Known methodological and electoral-law assumptions are documented beside the domain modules and in the project vision.

## Data preparation and methodology

Python and Jupyter sources under `scripts/` prepare the election datasets outside the React application. Some demographic values are modelled from differently aggregated source tables and must not be interpreted as individual-level observations.

The primary workflows live in `scripts/notebooks/btw2021/` and `scripts/notebooks/btw2025/`. See `scripts/README.md` for inputs, methodology, generated files, validation, and known limitations. The binary exporter runs only after those workflows and does not change their prepared `VoteEntry` output.

See [`docs/PROJECT_VISION.md`](docs/PROJECT_VISION.md) for the product scope, transparency requirements, technical principles, and known methodological limitations. More detailed source disclosure and methodology presentation remain tracked separately from this repository cut-over.

## Disclaimer
This app is mostly built with ChatGPT and partially by Claude. 
I downloaded the data from bundeswahlleiterin.de. 
I've done a brief check to make sure the data and calculations are plausible, but I haven't gone through every single case.
This app is a fun exercise and presentation of a few interesting scenariousexplaining few cases for the election. 

## License and third-party material

The application's own source code is licensed under the [MIT License](LICENSE), unless otherwise noted.

Election data, geographic data, prepared or derived datasets, and other third-party material are not relicensed under the repository's MIT License. They remain subject to their respective source licences, attribution requirements, and notices. See [`Licenses/sources-and-licenses.md`](Licenses/sources-and-licenses.md) for the data sources and applicable licence information.

Production builds also generate `dist/third-party-licenses.md`, containing licence information for dependencies bundled by Vite.
