# Static election data

The one-page rebuild loads the confirmed election datasets from `app-v2/public/data` as same-origin static assets. The files are copied without schema changes from the working legacy application.

| Purpose | Legacy source | `app-v2` destination |
| --- | --- | --- |
| Party names, abbreviations, colors, and seat positions | `src/data/partyData.json` | `app-v2/public/data/partyData.json` |
| Second-vote records used by the scenario filters | `src/data/second_votes.json` | `app-v2/public/data/second_votes.json` |
| Demographic reference vote records | `src/data/stat_votes.json` | `app-v2/public/data/stat_votes.json` |
| Direct-mandate totals by party | `src/data/election_results_direktmandate.json` | `app-v2/public/data/election_results_direktmandate.json` |

`germany_states_map.geo.json` is not copied in this ticket because the current `app-v2` one-page scope does not yet render a Germany map. It can be added unchanged if a later UI ticket adopts the legacy map.

Only `src/data/loaders.ts` knows the concrete asset paths and the raw `districts_won` field. Presentation components consume typed application values, including the normalized `districtsWon` property.
