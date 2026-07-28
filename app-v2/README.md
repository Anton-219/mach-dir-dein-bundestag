# app-v2

`app-v2` is the independent rebuild workspace for the new static one-page application. It does not import components, state, or styles from the legacy application in the repository root.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Commands

Run all commands from the `app-v2/` directory.

```bash
npm install
npm run dev
npm run lint
npm run build
```

- `npm run dev` starts the Vite development server.
- `npm run lint` checks the TypeScript and React source files.
- `npm run build` runs the TypeScript project build and creates the production bundle in `dist/`.

## JSON compatibility contracts

The input types in `src/models/json-contracts.ts` preserve the restored legacy JSON schema. Their field names and literal values must not change unless the corresponding data files are migrated at the same time.

All contracts were reviewed against the legacy model file `../src/types/ElectionTypes.tsx` and map to these restored data sources:

| Contract | Legacy JSON source |
| --- | --- |
| `Party` | `../src/data/partyData.json` |
| `DirectMandateWinnerJson` | `../src/data/election_results_direktmandate.json` |
| `VoteEntry` | `../src/data/second_votes.json` |
| `StatVotes` | `../src/data/stat_votes.json` |

The raw direct-mandate contract intentionally keeps `districts_won`. The legacy application-facing `DirectMandateWinner` model remains separate in `src/models/normalized-inputs.ts` with its `districtsWon` field, ready for the loader or adapter implemented in Ticket 03.

`ElectionResult` and `SeatResult` are calculated application models and therefore live separately in `src/models/calculation-results.ts`.

`src/models/json-contracts.fixture.ts` contains representative restored records and all literal-union values. Because the fixture is included in the TypeScript build, incompatible contract changes fail compilation.
