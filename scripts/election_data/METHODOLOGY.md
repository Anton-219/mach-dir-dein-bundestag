# Bundestag 2021 district-vote preparation

This package prepares `first_votes.json` and `second_votes.json` from local CSV files. It never downloads source data.

## Inputs

The required district-results input is the official polling-district CSV for the 2021 Bundestag election. The accompanying dataset description specifies UTF-8 with BOM, a semicolon delimiter, field names in the first row, constituency and state identifiers, district type, and separate `E_` and `Z_` party columns.

The required representative-statistics input contains vote type, state, gender, birth-year group and party totals. Comment lines beginning with `#` are ignored.

An optional third local CSV can provide the federal cross-tabulation of party, gender, age group and postal/in-person voting. When supplied, it is used as the seed for iterative proportional fitting. Without it, the method dimension begins with an independence assumption.

## Aggregation level

The official polling-district rows are aggregated to constituencies before JSON export. Polling districts therefore do not enter the application data.

District type `5` is treated as postal voting. The documented types `0`, `6` and `8` are grouped as in-person voting so that every reported vote remains represented in the two-value application model.

## Demographic profiles

For a party that is separately represented in the state statistics, its own state profile is used. Every other party, group and independent-candidate bucket uses the state's `Sonstige` profile. A uniform profile across the twelve gender/age cells is the final fallback when even that profile is unavailable.

This rule also applies to the SSW. The SSW is retained as a separate party from the official district results, but its missing detailed demographic profile is imputed from `Sonstige`, or uniformly if necessary. Electoral-law threshold exemptions and seat allocation are not part of this preparation package.

The source statistics publish two gender values. According to the source header, the results shown for men also include people recorded as diverse and people without a gender entry in the birth register. The generated value `gender="m"` therefore preserves that source definition and must not be interpreted as an exclusively male category.

## Iterative proportional fitting

For every state, vote type and party, a 12-by-2 table is fitted:

- rows: two published gender categories times six age groups;
- columns: in-person and postal voting.

The row margins are the state demographic profile scaled to the exact official party total. The column margins are the exact postal and in-person totals aggregated from the polling-district source. Iterative proportional fitting alternately rescales rows and columns until both margins agree within a strict numerical tolerance.

The fitted method-specific profile is then applied to each constituency:

```text
estimated_votes = official_district_method_total * fitted_profile_share
```

All constituencies of a state currently use the same fitted profile for a given party, vote type and method. A future constituency- or polling-district-level demographic profile can replace that input without changing the final `VoteEntry` calculation or JSON schema.

## Exactness and limitations

Every known constituency/party/method total is preserved. The generated demographic cells are modelled fractional vote weights, not observed individual ballots. A residual correction is applied after decimal rounding so that each exported source group sums back to its official total within the validation tolerance.

The representative statistics are themselves rounded and can differ slightly from the official result. They are therefore used as profile proportions rather than as competing official totals.

The polling-district source exposes aggregate columns such as `UNABHÄNGIGE` and `Übrige`; it does not necessarily identify every individual candidate inside those buckets. The preparation package preserves the distinctions present in the source but cannot reconstruct distinctions the CSV does not provide.
