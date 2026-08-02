# Static election data

The primary frontend loads the confirmed election datasets from `public/data` as same-origin static assets.

| Purpose | Application file |
| --- | --- |
| Party names, abbreviations, colours, and seat positions | `public/data/partyData.json` |
| Second-vote records used by the scenario filters | `public/data/second_votes.json` |
| Demographic reference vote records | `public/data/stat_votes.json` |
| Direct-mandate totals by party | `public/data/election_results_direktmandate.json` |
| Federal-state geometry used by the interactive map | `public/data/germany_states_map.geo.json` |

`src/data/loaders.ts` is the only application module that knows the concrete asset paths and raw field differences. Presentation components consume typed application values, including the normalized `districtsWon` property. The loader also verifies that the map and vote datasets contain matching federal-state coverage.

## Known source normalization

The final 24 SSW entries in `second_votes.json` contain the election method (`in-person` or `postal`) in `voteType` instead of the second-vote literal `2`. The committed JSON remains unchanged; the loader narrowly recognizes these Schleswig-Holstein SSW records and exposes their application-facing `voteType` as `2`.

The source-generation notebook should eventually correct this defect and validate the generated contract before writing the JSON file.
