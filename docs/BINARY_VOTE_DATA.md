# Binary vote runtime data

The Jupyter notebooks produce the canonical `first_votes.json` and `second_votes.json` files under `scripts/data/generated/<election>/`. Those JSON files are the human-readable output used for methodology review and validation and are intentionally ignored by Git.

The web application uses a separate compact runtime representation under `public/data/<election>/` to avoid transferring repeated JSON field names and string values for every `VoteEntry`.

## Generation flow

```text
Official source data under scripts/data/
        ↓
Jupyter preparation + validation notebooks
        ↓
scripts/data/generated/btw2021/*.json
scripts/data/generated/btw2025/*.json
        ↓
scripts/export_vote_binary.py
        ↓
public/data/btw2021/*.bin + vote_data.json
public/data/btw2025/*.bin + vote_data.json
        ↓
web application
```

Election-data preparation is deliberately explicit and is not part of `npm run dev` or `npm run build`.

Run only the notebooks and their validation notebooks with:

```bash
npm run prepare:vote-json
```

Convert existing generated JSON files into runtime binary assets with:

```bash
npm run prepare:vote-data
```

Run both steps in sequence with:

```bash
npm run prepare:election-data
```

The generated JSON files under `scripts/data/generated/` stay local. The resulting `.bin` files and `vote_data.json` manifests under `public/data/` are committed to Git because they are the assets the browser actually loads.

The notebook runner executes temporary copies through Jupyter `nbconvert`; it does not overwrite the committed notebooks with fresh cell outputs.

## Local source files

The notebooks deliberately read local source files instead of downloading them automatically. Download the official source files and place them at the documented paths under `scripts/data/` before running `npm run prepare:vote-json` or `npm run prepare:election-data`.

For 2021 the preparation notebook expects:

```text
scripts/data/btw21_wbz_ergebnisse.csv
scripts/data/btw21_rws_bst2.csv
```

For 2025 it expects:

```text
scripts/data/btw25_wbz_ergebnisse.csv
scripts/data/btw25_rws_bst2.csv
```

The detailed source descriptions and methodology are documented in `scripts/README.md` and `scripts/notebooks/btw2025/README.md`.

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

`scripts/tests/test_vote_binary_export.py` verifies binary generation with small synthetic `VoteEntry` fixtures, including separate source/runtime directories, legacy age-label normalization and constituency/state coverage checks.

`tests/unit/binary-vote-format.test.ts` verifies the browser-side decoder and manifest validation against a synthetic binary fixture.
