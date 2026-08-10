# Binary vote runtime data

The Jupyter notebooks continue to produce the canonical `first_votes.json` and `second_votes.json` files. Those JSON files remain the human-readable output used for methodology review and validation.

The web application uses a separate generated runtime representation to avoid transferring the repeated JSON field names and string values for every `VoteEntry`.

## Generation flow

```text
Official source data
        ↓
Jupyter notebooks
        ↓
first_votes.json / second_votes.json
        ↓
scripts/export_vote_binary.py
        ↓
first_votes.bin / second_votes.bin / vote_data.json
        ↓
web application
```

Run the export explicitly with:

```bash
npm run prepare:vote-data
```

`npm run dev` and `npm run build` invoke the same export automatically. The generated `.bin` files and `vote_data.json` manifests are ignored by Git.

Production builds remove the source `first_votes.json` and `second_votes.json` files from `dist/`. They remain committed in the repository but are not part of the deployed GitHub Pages payload.

## Binary schema version 1

Each binary file starts with a 32-byte little-endian header:

| Offset | Type | Meaning |
|---:|---|---|
| 0 | 8 bytes | magic bytes `MDBVOTE\0` |
| 8 | `uint16` | schema version |
| 10 | `uint8` | vote type (`1` or `2`) |
| 11 | `uint8` | reserved, currently `0` |
| 12 | `uint32` | record count |
| 16 | `uint32` | district column offset |
| 20 | `uint32` | party column offset |
| 24 | `uint32` | demographic-group column offset |
| 28 | `uint32` | vote-value column offset |

The payload is columnar:

- `districtIds`: `uint16` per record
- `partyIds`: `uint16` per record
- `groupIds`: `uint8` per record
- padding to the next 8-byte boundary
- `votes`: IEEE-754 `float64` per record

The vote values therefore retain the same 64-bit floating-point representation used by JavaScript numbers. This is important because the prepared data contains fractional vote weights.

The `groupId` combines the existing dimensions without changing their meaning:

```text
groupId = ageIndex + 6 × (genderIndex + 2 × electionMethodIndex)
```

with the fixed dictionaries:

```text
age:    18-24, 25-34, 35-44, 45-59, 60-69, 70+
gender: m, w
method: postal, in-person
```

Party strings and the constituency-to-state mapping are stored once in the accompanying `vote_data.json` manifest instead of being repeated for every row. The manifest also records SHA-256 hashes of the source JSON and generated binary file.

## Runtime compatibility

`src/lib/data/binary-vote-format.ts` validates the manifest, binary signature, schema version, offsets, record count and individual decoded values. `src/data/loaders.ts` then reconstructs the existing `VoteEntry[]` contract before the data reaches filters or electoral-system calculations.

This first implementation therefore changes the transport and parsing format without changing the calculation model. A future optimization can make the calculation layer operate directly on the exposed typed-array columns without changing the binary file format.

## Validation

`scripts/tests/test_vote_binary_export.py` verifies binary generation with small synthetic `VoteEntry` fixtures, including legacy age-label normalization and constituency/state coverage checks.

`tests/unit/binary-vote-format.test.ts` verifies the browser-side decoder and manifest validation against a synthetic binary fixture.
