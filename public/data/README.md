This folder contains the static data that is actually served to the web application.

Election-specific runtime files:
- `btw2021/first_votes.bin`, `btw2021/second_votes.bin` and `btw2021/vote_data.json`
- `btw2025/first_votes.bin`, `btw2025/second_votes.bin` and `btw2025/vote_data.json`

The binary files store the large repeated vote dimensions as compact integer columns and keep vote values as 64-bit floats. `vote_data.json` contains the versioned dictionaries and constituency-to-state metadata needed to decode the files.

These runtime files are committed to Git because they are the application assets used by development, production builds and GitHub Pages. `npm run dev` and `npm run build` do not regenerate election data.

The human-readable `VoteEntry` JSON files are generated separately by the notebooks under `scripts/notebooks/` and remain local under `scripts/data/generated/btw2021/` and `scripts/data/generated/btw2025/`. They are intentionally gitignored and are only needed when the election data itself is regenerated.

To regenerate election data intentionally:

```bash
npm run prepare:election-data
```

This executes the preparation and validation notebooks first and then converts their generated JSON files into the runtime files in this directory. The binary runtime format is documented in `docs/BINARY_VOTE_DATA.md`.

Shared and supporting files:
- `partyData.json`
  - Party names, abbreviations, colours, and parliamentary positions used across the supported elections.
- `germany_states_map.geo.json`
  - GeoJSON geometry for the German federal states.
- `state_seat_contingents_2021.json` and `state_seat_contingents_2025.json`
  - Election-year-specific distributions of the 598 initial seats among the federal states for simulations with the pre-2023 electoral-law model.

`src/data/loaders.ts` selects the matching binary vote files and state-seat-contingent fixture for the election chosen in the application.
