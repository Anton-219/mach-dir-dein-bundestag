# Election data preparation

The election JSON files are created through the notebooks in `scripts/notebooks/`. The notebooks are the main entry point: they show every source table, transformation, assumption, intermediate result, and validation step in execution order.

The Python modules in `scripts/election_data/` contain the reusable operations called by those notebook cells. They are deliberately kept out of the foreground so that the preparation process remains readable in the notebooks rather than becoming one opaque pipeline call.

## Bundestag election 2021

The current preparation notebooks are:

```text
scripts/notebooks/btw2021/
├── 01_prepare_btw2021_vote_entries.ipynb
└── 02_validate_btw2021_vote_entries.ipynb
```

The first notebook creates:

```text
scripts/data/generated/first_votes.json
scripts/data/generated/second_votes.json
```

The second notebook reads those finished files and checks their structure, coverage, duplicate rows, value ranges, file size, constituency examples, and nationwide percentage results.

## Required local source files

The notebooks only read local CSV files. They do not download data.

The preparation notebook expects two required inputs and one optional input:

1. The official polling-district result table for the 2021 Bundestag election. It contains the constituency number, state code, district type, and separate `E_` and `Z_` columns for first and second votes by party.
2. The representative election statistics by state, vote type, published gender category, birth-year group, and party.
3. Optionally, the federal table crossing party, gender, age group, and postal/in-person voting. This improves the starting pattern for the postal/in-person estimate but is not required to preserve the known totals.

Set the actual local paths near the beginning of the preparation notebook:

```python
DISTRICT_RESULTS_CSV = ROOT / "scripts/data/btw21_wbz_ergebnisse.csv"
STATE_DEMOGRAPHICS_CSV = ROOT / "scripts/data/btw21_rws_stimmabgabe_laender.csv"
FEDERAL_METHOD_DEMOGRAPHICS_CSV = None  # or a local Path
OUTPUT_DIRECTORY = ROOT / "scripts/data/generated"
```

The file names are local suggestions, not mandatory official names.

## Creating the JSON files

Open `01_prepare_btw2021_vote_entries.ipynb` and run it from top to bottom.

The notebook intentionally exposes the process step by step:

1. Read the polling-district CSV without changing it.
2. Inspect all constituency-number values before converting them to integers.
3. Display empty or invalid source rows before deciding whether they can be removed.
4. Normalize constituency, state, and election-method values.
5. identify the first- and second-vote party columns.
6. Reshape the wide party columns into individual vote rows.
7. Aggregate polling districts to constituencies.
8. Read the representative state statistics and display their summary rows.
9. Normalize gender, age, state, and vote-type dimensions.
10. Reshape the published party statistics into individual demographic rows.
11. Convert the rounded statistical counts into relative demographic profiles.
12. Optionally prepare the federal postal/in-person demographic pattern.
13. Fit the demographic and election-method margins.
14. Apply the fitted state profiles to every constituency.
15. Validate the preserved totals.
16. Write `first_votes.json` and `second_votes.json`.

Do not skip the displayed diagnostic tables. They are part of the preparation process and make changed source formats or unexplained rows visible before data is discarded or converted.

After creating the files, run `02_validate_btw2021_vote_entries.ipynb`. Its final tables show nationwide first- and second-vote percentages overall, by age group, by gender, and by the combination of age group and gender. These summaries provide a quick visual comparison with the published election and representative-statistics results.

## Output model

Both JSON files contain the same record shape:

```python
from dataclasses import dataclass
from typing import Literal

Gender = Literal["m", "w"]
AgeGroup = Literal["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
VoteType = Literal["1", "2"]
ElectionMethod = Literal["postal", "in-person"]


@dataclass(frozen=True)
class VoteEntry:
    districtId: int
    state: str
    gender: Gender
    ageGroup: AgeGroup
    party: str
    voteType: VoteType
    electionMethod: ElectionMethod
    votes: float
```

`districtId` is the constituency number for the corresponding election. Polling districts are used as an input source but are not stored in the application JSON.

`first_votes.json` contains only `voteType == "1"`; `second_votes.json` contains only `voteType == "2"`.

## Methodology

### What is observed and what is estimated

The source data does not publish the complete joint distribution required by the application:

```text
constituency × party × vote type × gender × age group × postal/in-person
```

The generated detail rows are therefore a modelled combination of several published aggregate tables. They are not observed individual ballots and should not be described as a directly published fine-grained dataset.

The exact constituency totals come from the official polling-district result table. The demographic and postal/in-person subdivisions inside those totals are estimated.

### Polling districts and constituencies

The official result input is read at polling-district level. District type `5` is treated as postal voting. The documented types `0`, `6`, and `8` are grouped as `in-person` so that every reported vote remains represented in the two-value application model.

The polling-district rows are then aggregated by:

```text
constituency × state × party × vote type × election method
```

These constituency totals are the fixed basis of the final JSON. The model must not change them.

### Representative demographic statistics

The representative statistics provide party results by state, vote type, gender category, and age group. Their published absolute values can differ slightly from the official result because of rounding and statistical methodology.

For that reason, the notebook uses them as proportions rather than competing official totals:

```text
demographic share
=
statistical votes in the demographic cell
÷
statistical party total in the state
```

The resulting shares are later scaled to the exact official totals from the polling-district source.

The source publishes the categories `m` and `w`. According to the source header, the results shown under the male category also include people recorded as diverse and people without a gender entry in the birth register. The generated value `gender="m"` preserves that source definition and must not be interpreted as an exclusively male category.

### Parties without their own demographic column

All party and aggregate columns present in the official result source are retained.

The demographic profile is chosen in this order:

1. Use the party's own profile when the representative statistics publish it separately.
2. Otherwise use the state's `Sonstige` profile for the same vote type.
3. If that is also unavailable, use an equal distribution across the twelve gender/age cells.

This rule applies to small parties, aggregate candidate categories, and the SSW. The SSW remains a separate party in the result data, while its missing detailed demographic distribution is explicitly imputed. Electoral-law exemptions and seat allocation are separate from this data-preparation step.

### Postal and in-person voting

For every state, vote type, and party, the model builds a table with:

```text
rows:    2 published gender categories × 6 age groups
columns: in-person × postal
```

The known row margins are the normalized demographic shares scaled to the official party total. The known column margins are the exact in-person and postal totals from the official result source.

Iterative proportional fitting repeatedly rescales rows and columns until both sets of margins agree within a strict numerical tolerance.

When the optional federal method-demographic CSV is available, its party-specific pattern is used as the starting table. If a party has no separate federal pattern, `Sonstige` is used. Without either pattern, the method starts from the assumption that the demographic and election-method distributions are independent. The fitted result still preserves the same known state margins.

### Applying the profile to constituencies

Every constituency in a state currently receives the same fitted profile for a given party, vote type, and election method:

```text
estimated_votes
=
official constituency/method total
×
fitted state profile share
```

The actual constituency totals therefore remain different and exact. Only their internal demographic distribution is assumed to follow the same state profile.

A future source may provide constituency- or polling-district-specific demographic profiles. Such a profile can replace the current state profile without changing the final `VoteEntry` schema or the basic multiplication step. Polling-district estimates could then be aggregated back to constituencies before export.

### Fractional votes and conservation

The detailed values are fractional vote weights because they represent an estimated distribution, not individual ballot records.

The preparation avoids rounding every detail cell to a whole number. A small residual correction after decimal rounding ensures that every exported constituency/party/vote-type/election-method group sums back to its official source total within the validation tolerance.

The validation checks both:

```text
sum of demographic cells
=
official constituency and election-method total
```

and:

```text
sum across constituencies and methods
=
fitted state demographic margin
```

### Known limitations

The current model assumes that all constituencies of a state share the same party-specific demographic and election-method profile.

Parties without a separate representative-statistics column inherit `Sonstige` or, as a final fallback, a uniform profile. This allows every recorded vote to react to application filters, but it does not claim that the imputed profile is observed.

The polling-district source can contain aggregate columns such as `UNABHÄNGIGE` or `Übrige`. The preparation preserves distinctions available in the source but cannot reconstruct individual candidates or parties that the source has already combined.

The generated dataset should therefore be presented as a transparent statistical interpolation constrained by official totals, not as an exact demographic census of every constituency.

## Automated checks

The notebooks are the primary way to create and inspect the data. Small automated tests remain useful because they verify individual operations even when the full local CSV files are unavailable or a notebook stops before writing output.

Run them from the repository root with:

```bash
python -m scripts.run_tests
```

The tests cover constituency-row diagnostics, use of rounded statistics as shares, iterative proportional fitting, preservation of known margins, and the separate seat-allocation reference calculations.

## Related Python modules

The notebook cells use small helpers from `scripts/election_data/` for source normalization, reshaping, profile fitting, distribution, validation, and JSON writing. Seat-allocation experiments live separately in `scripts/election/`; they do not determine how the vote-entry JSON files are prepared.
