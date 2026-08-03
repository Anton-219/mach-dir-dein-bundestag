# Static election data

The primary frontend loads the prepared election datasets from `public/data` as same-origin static assets.

| Purpose | Application file |
| --- | --- |
| Party names, abbreviations, colours, and seat positions | `public/data/partyData.json` |
| Constituency-aware first-vote records used to determine district winners | `public/data/first_votes.json` |
| Constituency-aware second-vote records used by the scenario calculation | `public/data/second_votes.json` |
| Demographic reference vote records | `public/data/stat_votes.json` |
| Federal-state geometry used by the interactive map | `public/data/germany_states_map.geo.json` |

`src/data/loaders.ts` is the only application module that knows the concrete asset paths. It validates the shared vote-entry contract, requires first- and second-vote records to carry the correct `voteType`, verifies positive constituency IDs, and checks that both vote files agree on constituency-to-state and federal-state coverage.

The active scenario applies the same state, age-group, gender, and election-method filters to both vote files. Second votes determine party results and seat allocation. First votes are aggregated by constituency and party to calculate the district winners used by the three-direct-mandate qualification rule.

The generated JSON model and its preparation methodology are documented in `scripts/README.md`.
