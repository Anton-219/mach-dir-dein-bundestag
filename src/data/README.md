# Static election data

The primary frontend loads the prepared election datasets from `public/data` as same-origin static assets.

| Purpose | Application file |
| --- | --- |
| Party names, abbreviations, colours, and seat positions | `public/data/partyData.json` |
| Constituency-aware first-vote records used to determine district winners | `public/data/btw2021/first_votes.json` |
| Constituency-aware second-vote records used by the scenario calculation and the demographic presentation | `public/data/btw2021/second_votes.json` |
| Federal-state geometry used by the interactive map | `public/data/germany_states_map.geo.json` |
| Historical 2021 state seat contingents for the pre-2023 calculator | `public/data/state_seat_contingents_2021.json` |

`src/data/loaders.ts` is the only application module that knows the concrete asset paths. It validates the shared vote-entry contract, requires first- and second-vote records to carry the correct `voteType`, verifies positive constituency IDs, and checks that both vote files agree on constituency-to-state and federal-state coverage.

The historical state-contingent loader validates schema version, electoral-system identifier, election year, base size, unique state coverage, non-negative integer values, and the required total of 598 seats. It exposes the normalized state-to-seat record as supporting data; electoral-system calculators never load static files themselves.

The active scenario applies the same state, age-group, gender, and election-method filters to both vote files. Second votes determine party results and proportional allocations. First votes are aggregated by constituency and party to calculate the district winners shared by all electoral-system strategies.

The generated JSON model and its preparation methodology are documented in `scripts/README.md`.
