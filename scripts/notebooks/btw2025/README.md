# Bundestag election 2025 notebooks

This directory contains the 2025 counterpart to the existing Bundestag 2021 data-preparation workflow.

## Files

- `01_prepare_btw2025_vote_entries.ipynb`
  - reads the official polling-district results and representative election statistics;
  - converts the 2025 source layouts;
  - fits demographic profiles to the exact constituency and postal/in-person totals;
  - writes `scripts/data/generated/btw2025/first_votes.json` and `second_votes.json`.
- `02_validate_btw2025_vote_entries.ipynb`
  - validates the finished JSON files independently;
  - checks their record structure and category domains;
  - reconstructs the official source totals and checks that they are preserved.

## Required local inputs

Place the downloaded CSV files at these paths, or change the notebook constants:

```text
scripts/data/btw25_wbz_ergebnisse.csv
scripts/data/btw25_rws_bst2.csv
```

The files are not committed because they are external source data.

## Source-specific decisions

The polling-district file contains a metadata preamble before the semicolon-separated header. The 2025 reader searches for the row beginning with `Wahlkreis;Land` instead of relying on a fixed number of skipped lines.

The party columns use names such as `SPD - Erststimmen` and `SPD - Zweitstimmen`. The 2025 reshaper detects these suffixes and excludes the valid/invalid aggregate columns.

The representative statistics publish `m|d|o` for men together with people recorded as diverse and people without a gender entry. The established JSON field remains `gender="m"` so the shared `VoteEntry` record shape is preserved, but the notebooks and code explicitly retain the broader source meaning.

The published birth-year cohorts are converted as follows:

| Source cohort | JSON `ageGroup` |
|---|---|
| `2001-2007` | `18-24` |
| `1991-2000` | `25-34` |
| `1981-1990` | `35-44` |
| `1966-1980` | `45-59` |
| `1956-1965` | `60-69` |
| `<=1955` | `70+` |

These boundaries differ from the 2021 groups. The workflow does not invent a split into the 2021 bins. The JSON record structure is shared, but the frontend must offer election-specific age filters before the 2025 files can be used as live application data.

## Methodology

The exact constituency, party, vote-type, and postal/in-person totals come from the polling-district file. The demographic distribution comes from the representative statistics at state level and is used as a proportional profile. Iterative proportional fitting preserves both the demographic margins and the official postal/in-person totals.

As in the 2021 workflow, the generated detailed rows are a transparent statistical interpolation. They are not individual ballot records.
