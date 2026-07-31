# Election data preparation methodology

This directory contains the data-preparation scripts used to turn published 2021 Bundestag election tables into the JSON records consumed by the application.

The current scripts produce a usable exploratory dataset. They do **not** reconstruct an observed individual-level or fully cross-tabulated election dataset. Some combinations required by the application are not published in the source tables and are therefore estimated from separate aggregate tables.

This document records the current methodology, its assumptions, known limitations, and the questions that should be resolved before the import is treated as a stable or reusable data pipeline.

## Current status

The scripts are a working prototype for the 2021 election data. Their main purpose is to support interactive filtering by:

- federal state,
- gender,
- age group,
- postal or in-person voting,
- party,
- first or second vote.

The published source data does not expose every one of these dimensions together. In particular, the scripts do not receive a source table with the complete joint distribution:

```text
federal state × election method × gender × age group × party × vote type
```

The scripts construct that finer-grained representation by combining two differently aggregated source tables.

## Main script and helpers

- `collect_vote_results_2021.ipynb` downloads or reads the source CSV files, cleans them, combines their dimensions, adds explicitly handled records, and writes JSON files.
- `util/csv.py` contains the data classes, category mappings, party aggregation, and the proportional allocation function.
- `util/web.py` contains the download helper.
- `util/tsetrec.py` is unrelated to the election-data import. It enumerates value combinations that reach a target and appears to be an older coalition-related helper.

## Source tables used by the notebook

The notebook currently references two CSV publications from the Federal Returning Officer.

### Results by federal state and election method

This table supplies exact aggregate vote totals by:

```text
federal state × vote type × election method × party
```

The notebook distinguishes:

- first votes (`E`),
- second votes (`Z`),
- in-person votes (`Urne`),
- postal votes (`Brief`).

National summary rows and rows combining both election methods are removed.

### Results by federal state, gender, and age group

This table supplies aggregate vote totals by:

```text
federal state × vote type × gender × age group × party
```

It does not provide the postal/in-person dimension together with gender and age. It also exposes only the parties represented by its published columns; smaller parties are already grouped into `Sonstige` in this source.

The exact scope, definitions, and suppression or aggregation rules of both source files should be verified against their accompanying documentation in a future source review.

## Output data models

The notebook currently creates records equivalent to the following conceptual data classes.

```python
from dataclasses import dataclass
from typing import Literal

Gender = Literal["m", "w"]
AgeGroup = Literal["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
VoteType = Literal["1", "2"]
ElectionMethod = Literal["postal", "in-person"]


@dataclass(frozen=True)
class VoteEntry:
    state: str
    gender: Gender
    ageGroup: AgeGroup
    party: str
    voteType: VoteType
    electionMethod: ElectionMethod
    votes: float


@dataclass(frozen=True)
class StatVoteEntry:
    gender: Gender
    ageGroup: AgeGroup
    party: str
    votes: float
```

A `VoteEntry` is an estimated number of votes for one combination of state, demographic group, party, vote type, and election method.

A `StatVoteEntry` is the corresponding second-vote total aggregated across states and election methods for one gender, age group, and party.

The generated files are:

- `first_votes.json`,
- `second_votes.json`,
- `stat_votes.json`.

The current React application primarily uses `second_votes.json`. Whether `first_votes.json` and `stat_votes.json` remain necessary should be confirmed separately from the methodology documented here.

## Processing workflow

The current notebook performs the following steps.

1. Read the state/election-method CSV, skipping its introductory rows.
2. Remove national totals, combined election-method rows, and unused administrative columns.
3. Map `Urne` to `in-person` and `Brief` to `postal`.
4. Keep a selected set of parties as separate columns and combine all other party columns into `Other`.
5. Split the table into first-vote and second-vote data.
6. Read the gender/age CSV, skipping its introductory rows.
7. Remove total rows and source-specific detail columns that are not used by the application.
8. Convert published birth-year ranges into the six application age groups.
9. Split the demographic table into first-vote and second-vote data.
10. Proportionally distribute each demographic party total between postal and in-person voting using the state-level election-method totals.
11. Add separately handled SSW records because the demographic source does not expose SSW as its own party column.
12. Serialize first- and second-vote entries to JSON.
13. Aggregate second-vote entries by gender, age group, and party to create `stat_votes.json`.

## Proportional estimation

For a given federal state, party, vote type, gender, and age group, the demographic source provides a party total but not its split between postal and in-person voting.

The current script estimates that split as follows:

```text
estimated votes for a demographic group and election method
=
party votes for that demographic group
×
party votes for that election method in the state
÷
total demographic party votes in the state
```

For example, the script may know:

- all SPD postal votes in Hesse, and
- all SPD votes cast by women aged 25–34 in Hesse,

but it does not directly know the SPD postal votes cast by women aged 25–34 in Hesse. The missing value is estimated by applying the party's overall postal/in-person ratio in Hesse to that demographic group.

### Statistical assumption

This calculation assumes that, within a federal state, party, and vote type, the demographic distribution is independent of the election method:

```text
gender and age group ⟂ election method
conditioned on federal state, party, and vote type
```

In practical terms, every demographic group of a party is assigned the same postal/in-person ratio within a state.

This assumption is necessary for the current dataset because the full cross-tabulation is unavailable. It is not established by the source data and should be described wherever the generated data is presented as methodology rather than as an observed result.

## Party coverage and `Sonstige`

The current notebook keeps these parties separate before creating the synthetic records:

- CDU,
- SPD,
- AfD,
- FDP,
- DIE LINKE,
- GRÜNE,
- CSU,
- SSW.

All remaining party columns in the state/election-method table are summed into `Other`, which is later emitted as `Sonstige`.

This is partly forced by the demographic source, which already groups smaller parties into `Sonstige`. Once parties have been grouped in that source, their demographic distributions cannot be recovered from that file.

Consequences include:

- smaller parties cannot be analysed separately across gender and age using the current source combination;
- a smaller party cannot later be recovered from the generated `Sonstige` records;
- selecting the list of separately retained parties is a methodological decision, not only a formatting choice;
- adding another party requires a source that exposes enough information to model it separately, or an explicitly documented imputation method.

The retained-party list should eventually become election-specific configuration instead of remaining embedded in the notebook.

## SSW handling

SSW requires separate treatment for two different reasons.

### Preservation as a party

SSW must remain separate from `Sonstige` because its minority-party status means the ordinary national vote-share threshold is not applied in the same way as for other parties.

The data import should preserve SSW as a distinct party. It should not decide the final parliamentary representation itself.

The intended downstream behaviour is:

1. do not exclude SSW through the ordinary national vote-share threshold;
2. include its votes in the normal seat allocation;
3. show SSW as represented only when that allocation produces at least one seat.

A fixed number such as 40,000 votes can be a rough implementation approximation for one dataset, but it is not a stable import rule. The number of votes required for a seat depends on the complete vote distribution and seat-allocation procedure.

### Missing demographic breakdown

The demographic source does not expose an SSW column. The current notebook therefore adds SSW second-vote records manually.

For each election method in Schleswig-Holstein, the exact SSW total from the state/election-method source is divided equally across:

```text
2 genders × 6 age groups = 12 demographic groups
```

This produces a usable set of filter records while preserving the total SSW vote count for each election method before later rounding.

The equal distribution is a placeholder assumption. It implies identical SSW support for every gender/age group within an election method and is not supported by an observed SSW demographic table.

Possible future alternatives include:

- use a separate source with an SSW demographic breakdown;
- distribute SSW according to the overall Schleswig-Holstein voter profile;
- distribute SSW according to the demographic profile of `Sonstige` in Schleswig-Holstein;
- exclude demographic SSW analysis and explain that the required breakdown is unavailable.

A future source review should choose one approach explicitly and document why it is preferable to equal distribution.

## Other methodological decisions

### Age-group mapping

The source birth-year ranges are mapped to:

```text
18-24, 25-34, 35-44, 45-54, 55-64, 65+
```

These mappings are specific to the 2021 election and the ranges published in that source. They must not be reused for another election without checking the corresponding birth years and election date.

### Federal-state mapping

The demographic source uses state abbreviations, which are mapped to full state names. Special Berlin subdivisions such as `BE-O` and `BE-W` are currently skipped because they are not part of the 16-state mapping.

The likely intention is to use the separate full-Berlin rows and avoid double counting. This should be turned into an explicit source rule and validation instead of treating every unknown region as skippable.

### Fractional votes

The proportional split naturally produces floating-point values. These values are synthetic weights representing estimated votes, not observed ballot records.

The pipeline should preserve totals as far as possible. Rounding each fine-grained record before aggregation can change totals and should be avoided. If integer output is required, a total-preserving rounding method should be selected and documented.

### Missing and zero values

The current calculation returns zero when a demographic party total is zero. A future implementation should distinguish between:

- a genuine observed zero,
- a missing value,
- a suppressed value,
- an inconsistent pair of source tables.

Missing or inconsistent source data should not silently become zero without a documented rule.

## Known implementation issues in the current notebook

These issues do not invalidate the purpose of the current working dataset, but they should be corrected when the import pipeline is revised.

### Incorrect SSW `voteType`

The manually appended SSW second-vote records currently assign the election method to both `voteType` and `electionMethod`.

The intended values are:

```python
voteType="2"
electionMethod=election_method
```

The application loader currently repairs this narrowly identified legacy defect at its data boundary.

### Incorrect demographic-source download call

When the demographic CSV is missing locally, the notebook calls the download helper with the wrong source and destination arguments. The intended call is conceptually:

```python
download(url_by_age_and_gender, csv_file_data_by_gender_and_age)
```

### Inconsistent import paths

The notebook imports helpers both as `util.csv` and `scripts.util.csv`. This makes execution dependent on the Jupyter working directory and Python path.

### Rounding before aggregation

`stat_votes.json` is currently created by rounding individual synthetic entries before summing them. This can make statistical totals differ from the source and generated vote totals.

### Limited validation

The notebook prints skipped state codes but does not enforce a complete set of input and output invariants. It can therefore produce files despite silent data loss, schema mistakes, or changed source columns.

## Recommended validation rules

A revised pipeline should fail clearly when its assumptions are violated and should verify at least the following invariants.

### Schema checks

- every `VoteEntry.voteType` is `"1"` or `"2"`;
- every election method is `postal` or `in-person`;
- every gender and age group belongs to the configured literal set;
- every vote value is finite and non-negative;
- all expected federal states are represented;
- only explicitly documented source regions are excluded.

### Conservation checks

For every federal state, vote type, election method, and separately represented party:

```text
sum across gender and age group
≈ exact source total for that state/election-method group
```

The accepted tolerance should be explicit and should account only for floating-point arithmetic or a documented rounding algorithm.

The separately generated SSW entries must sum exactly, or within the same documented tolerance, to the source SSW totals.

### Coverage checks

- every configured separately represented party exists in the relevant source or has a documented imputation rule;
- all non-retained party columns are accounted for in `Sonstige`;
- changes to source column names or category labels fail loudly;
- the generated JSON conforms to the application-facing data contract.

### Reproducibility checks

The pipeline should record or pin:

- election year,
- source URLs,
- source file checksums,
- retrieval date,
- configured party list,
- age mapping,
- region handling,
- imputation rules,
- output schema version.

## Recommended separation of responsibilities

The current notebook mixes three concerns that should eventually be separated.

### 1. Source import

Responsible for downloading, parsing, normalising labels, and preserving the information actually present in the source files.

### 2. Statistical estimation

Responsible for constructing unavailable cross-dimensions, including the postal/in-person proportional split and any SSW demographic imputation. Every estimation rule should be configurable and documented.

### 3. Election-law and seat calculation

Responsible for party qualification, threshold exemptions, direct mandates, seat allocation, and parliamentary representation.

The import layer should preserve parties and votes but should not encode a fixed vote count as proof that a party receives a seat.

## Open questions for the next source review

The following questions should be answered from the official source documentation or additional publications before the methodology is finalised.

1. What exact population and vote categories does each CSV cover?
2. Are values based on the complete result or representative election statistics?
3. Which dimensions are genuinely observed together in each file?
4. Which rows or values are totals, subsets, estimates, suppressed values, or overlapping regional subdivisions?
5. Which smaller parties are combined before publication, and is a more detailed source available elsewhere?
6. Is any separate demographic information available for SSW or other currently grouped parties?
7. Can postal/in-person behaviour be obtained by demographic group from another source?
8. Are gender categories limited to `m` and `w` by the source methodology, and how should that limitation be described?
9. How should rounding and statistical weighting be represented in the output?
10. Which generated files are still required by the current application?

Until these questions are resolved, the generated dataset should be described as an exploratory, modelled combination of published aggregate election results rather than a direct reproduction of a published fine-grained table.

## Scope of this documentation

This README records the behaviour and interpretation of the current scripts. It does not claim that the current assumptions are final, and it does not replace a future review of the official source methodology.

The present scripts remain useful because they produce a coherent dataset for application development. Future changes should preserve that practical capability while making each source limitation, estimation rule, and election-specific decision explicit and testable.
