# Supported electoral-system variants

Status: normative architecture specification for issue #37 and the implementation stories in epic #36.

This document defines the supported variants, modeling assumptions, required data, filter semantics, deterministic reference scenarios, and aggregate output contract. Later stories may refine implementation details, but must not silently change these decisions.

## 1. Supported systems

| `systemId` | Variant | Legal/modeling reference |
| --- | --- | --- |
| `de-2021-bwahlg` | Electoral law used for the Bundestag election on 26 September 2021 | Bundeswahlgesetz as amended on 14 November 2020 |
| `de-2023-fixed-630` | Fixed-size law introduced in 2023 | Bundeswahlgesetz as amended on 8 June 2023, including the Federal Constitutional Court's transitional three-constituency rule of 30 July 2024 |
| `union-parallel` | Parallel/Grabenwahl model | Independent direct and list tiers, configured by the project as 299 + 299 |

A **direct win** is the modeled first-vote plurality in a district containing at least one modeled valid first vote. A **direct seat** is a direct win that actually receives a Bundestag seat.

An **empty district** has zero modeled valid first votes. It has no winner and no direct win.

An **inactive state** is a state excluded through the regional filter. Its modeled first- and second-vote totals are both zero. It remains part of Germany, retains its districts and its configured historical seat contingent, and is not removed from the electoral territory.

The result is party-level only. Candidate names, list positions, biographies, and statements about which individual candidate enters parliament are outside this epic.

## 2. Shared scenario boundary

Vote filtering and seat allocation are separate stages:

1. The scenario builder applies the same active demographic, voting-method, and regional filters to first and second votes.
2. The existing first-vote model performs its interpolation and clamping outside the electoral-system calculators.
3. The scenario is normalized once.
4. Every electoral-system strategy receives that same normalized scenario.
5. Each strategy applies only eligibility and seat-allocation rules.

No strategy may read UI state, repeat demographic interpolation, load JSON files directly, derive population from the filtered electorate, remove states, or alter district boundaries.

A normalized scenario always retains all 16 states and all 299 districts, including inactive states and empty districts:

```ts
interface ElectoralScenario {
  mode: 'unfiltered-reference' | 'filtered-model'
  validSecondVotes: number

  parties: Record<PartySlug, {
    secondVotes: number
    isNationalMinorityParty: boolean
  }>

  states: Array<{
    state: StateSlug
    isActive: boolean
    validFirstVotes: number
    validSecondVotes: number
    secondVotesByParty: Record<PartySlug, number>
  }>

  districts: Array<{
    districtId: number
    state: StateSlug
    validFirstVotes: number
    firstVotesByParty: Record<PartySlug, number>
  }>
}
```

State activity is an invariant, not an independently filterable property of each vote type:

```text
state.isActive = false
  => state.validFirstVotes = 0
  => state.validSecondVotes = 0
  => every district in the state has validFirstVotes = 0

state.isActive = true
  => first- and second-vote data are both included and modeled
```

The application does not support scenarios in which a state has first votes but no second votes, or second votes but no first votes. There is no first-vote-only or second-vote-only filter. A normalized scenario violating this contract returns `INCONSISTENT_STATE_ACTIVITY`.

A scenario with zero valid second votes nationwide cannot perform a proportional allocation and returns `NO_VALID_SECOND_VOTES`. Because vote-type filtering is unsupported, this normally also means that no state is active and no first votes remain.

## 3. Meaning of filters

Filters model **non-participation**, not a changed population or electoral territory.

For every ordinary filter:

- only matching first and second votes remain in the modeled vote totals;
- historical state seat contingents remain unchanged;
- all states remain present in the normalized scenario;
- all 299 districts and their boundaries remain present;
- no district is transferred to another state;
- no institutional seat capacity is recalculated from the filtered group.

Selecting only voters aged 18–24 therefore means: “What if only this group had cast votes?” It does not mean that Germany's population consists only of that group.

Excluding a state means: “The state remains part of Germany, but no first or second votes from it are counted.” It does not remove the state, its historical seat contingent, or its districts from the model.

A future simulation of changed state borders, population bases, district maps, or institutional seat capacities is a separate feature and must not be implemented as ordinary filter behavior.

## 4. Historical state-seat-contingent fixture

`de-2021-bwahlg` does not receive population figures. It receives the already calculated number of initial seats assigned to each state for the supported election year.

The fixture is normative input to the calculator:

```ts
interface HistoricalStateSeatContingentFixture {
  electionYear: number
  legalVersion: string
  baseSeatCount: 598
  seatsByState: Record<StateSlug, number>
}
```

Recommended JSON shape:

```json
{
  "electionYear": 2021,
  "legalVersion": "de-2021-bwahlg",
  "baseSeatCount": 598,
  "seatsByState": {
    "Schleswig-Holstein": 0
  }
}
```

The example value is only structural; the committed fixture must contain the authoritative values for all 16 states.

Validation rules:

```text
all 16 states occur exactly once
all values are non-negative integers
sum(seatsByState) = baseSeatCount = 598
```

The fixture is loaded and validated by the scenario/configuration adapter, not by the calculator itself. It remains identical for filtered and unfiltered scenarios.

This deliberately replaces population data as a runtime dependency. The application does not recalculate state contingents and therefore needs no population statistics by gender, age, voting method, or active filter selection.

The parallel model does not need this fixture. Its direct capacity per state is derived from the number of configured districts in that state; its list tier is allocated from second votes.

## 5. District-winner resolution

Winner resolution is shared by all calculators and happens before system-specific seat allocation.

For district `d`:

```text
E[d] = sum_P firstVotes[P,d]

if E[d] == 0:
  winner[d] = none
else:
  winner[d] = argmax_P(firstVotes[P,d])
```

A zero-vote district must never receive an artificial winner through array order, party slug, random choice, or the general tie-break rule.

If two or more parties tie at the same positive maximum, resolve the tie by ascending stable party slug and emit `DISTRICT_TIE_REPLACED_BY_STABLE_ORDER`. This is a deterministic simulation convention, not a reproduction of a legal lot.

```text
allocatedDistrictCount = count(district where validFirstVotes > 0)
emptyDistrictCount = 299 - allocatedDistrictCount
sum_P directWins[P] = allocatedDistrictCount
```

For the unfiltered 2021 reference, `allocatedDistrictCount = 299`.

## 6. Eligibility and special cases

A party participates in proportional or list-seat allocation when at least one condition is true:

- it receives at least 5% of all valid second votes nationwide;
- it wins at least three non-empty districts; or
- it is configured as a party of a national minority.

The denominator is all valid second votes, including votes for parties that later fail the threshold.

Minority status is explicit legal metadata. For the 2021 data, `SSW` has `isNationalMinorityParty: true`. The exemption admits SSW to apportionment but does not guarantee a seat.

A party below 5% with only one or two direct wins is handled differently:

- `de-2021-bwahlg`: its direct winners receive seats, but its second votes do not participate in proportional allocation;
- `de-2023-fixed-630`: it receives no party seats and its district pluralities are uncovered;
- `union-parallel`: its direct winners receive direct-tier seats, but it receives no list-tier seats.

Successful independent candidates are unsupported because the project has no candidate-level independent-vote contract. A scenario containing one returns `UNSUPPORTED_INDEPENDENT_WINNER` rather than silently misallocating seats.

## 7. Common apportionment primitive

All proportional allocations use Sainte-Laguë/Schepers with standard rounding.

```text
seats_i = roundHalfUp(votes_i / divisor)
```

Choose the divisor so that rounded seats sum to the required seat count. An equivalent highest-averages implementation may use `votes_i / (2 * seats_i + 1)`.

German law resolves exact allocation ties by lot. The application must be deterministic, so an exact quotient tie is resolved by ascending stable party slug, then ascending state slug or district id where needed. Emit `LEGAL_LOT_REPLACED_BY_STABLE_ORDER` whenever this fallback is used.

An allocation with a positive seat count and no positive votes is invalid. It must not invent recipients by stable ordering.

## 8. `de-2021-bwahlg`

### 8.1 Size and mandate rules

- Nominal size: 598 seats.
- District map: 299 fixed districts.
- Every modeled district winner receives a direct seat.
- An empty district produces no direct seat.
- Empty districts and inactive states do not reduce the nominal size.
- Overhang and compensation can increase the final size.
- Up to three overhang seats may remain uncompensated.

```text
totalSeats >= 598
majorityThreshold = floor(totalSeats / 2) + 1
```

### 8.2 Initial state allocation

The calculator consumes `HistoricalStateSeatContingentFixture` and never calculates state contingents from population.

Let:

- `C[L]` be the configured initial seat contingent of state `L`;
- `D[P,L]` be direct wins of party `P` in `L`;
- `Z[P,L]` be second votes of party `P` in `L`.

Direct wins of parties excluded from proportional allocation are reserved. To preserve the fixed state-contingent fixture without a population recalculation, these reserved seats reduce the distributable contingent of the same state:

```text
reservedDirectSeats[L] =
  sum direct wins in L by parties excluded from proportional allocation

effectiveContingent[L] =
  C[L] - reservedDirectSeats[L]
```

A negative effective contingent is invalid and returns `INVALID_STATE_SEAT_CONTINGENT_FIXTURE`.

For each state:

- active state: allocate `effectiveContingent[L]` among eligible state lists by state second votes;
- inactive state: allocate zero preliminary party seats, regardless of its configured `C[L]`.

Call the preliminary allocation `A[P,L]`.

An inactive state therefore retains its configured historical contingent as institutional input but creates neither a preliminary party allocation nor a direct-seat minimum. The unallocated preliminary state contingent is not removed from the final national base size: the national upper allocation still begins from 598 actual seats.

This inactive-state treatment is an explicit simulation convention. Emit `INACTIVE_STATE_SIMULATION` with the affected state slugs.

### 8.3 State and national minima

For every eligible party/list:

```text
stateMinimum[P,L] = max(
  D[P,L],
  floor((D[P,L] + A[P,L]) / 2 + 0.5)
)

partyMinimum[P] = max(
  sum_L(stateMinimum[P,L]),
  sum_L(A[P,L])
)
```

For an inactive state, both `D[P,L]` and `A[P,L]` are zero.

### 8.4 Upper and final allocation

Starting at `T = 598`, find the smallest total size for which:

- seats available to eligible parties can be allocated nationally by second votes;
- every party minimum is satisfied;
- at most three overhang seats remain uncompensated;
- reserved direct seats are retained.

For the unfiltered 2021 reference, the final result is 736 seats.

Allocate each eligible party's national total among its active state lists by state second votes, subject to the state minima. Inactive state lists receive no list seats.

For an eligible party:

```text
directSeats = directWins
listSeats = totalSeats - directSeats
```

For a non-eligible party with one or two reserved wins:

```text
totalSeats = directSeats = directWins
listSeats = 0
```

## 9. `de-2023-fixed-630`

### 9.1 Size and mandate rules

- Fixed size: 630 seats.
- District map: 299 fixed districts.
- No overhang or compensation seats.
- A district plurality becomes a direct seat only when covered by the party's state-level second-vote allocation.
- An empty district has no winner and is neither covered nor uncovered.
- Empty districts and inactive states do not reduce the chamber size.

```text
totalSeats = 630
majorityThreshold = 316
```

### 9.2 Allocation

1. Allocate all 630 seats nationally among eligible parties by nationwide second votes.
2. Allocate each party's seats among its active state lists by state second votes. Inactive states receive zero state-list seats.
3. In each party/state combination, rank direct winners by descending first-vote share:

   ```text
   firstVoteShare = partyFirstVotes / validFirstVotesInDistrict
   ```

4. Cover the first winners up to the party's state-seat count. Remaining direct wins are uncovered.
5. Return aggregate counts:

   ```text
   directSeats = covered direct wins
   uncoveredDistrictWins = directWins - directSeats
   listSeats = totalSeats - directSeats
   ```

An inactive state produces neither direct winners nor state-list seats. All 630 seats are nevertheless allocated from the remaining nationwide second votes; no seat remains vacant.

## 10. `union-parallel`

The project models two independent tiers.

```ts
interface ParallelSystemConfig {
  maximumDirectSeatCount: 299
  fixedListSeatCount: 299
  listEligibility: 'shared-threshold-rules'
}
```

Allocation:

1. Resolve a winner in each non-empty district. Every winner receives a direct-tier seat.
2. An empty district awards no direct seat. It is not transferred, reassigned, or converted into a list seat.
3. Independently allocate exactly 299 list seats among eligible parties by nationwide second votes.
4. Allocate each party's list seats among active state lists by state second votes.
5. Do not offset the tiers.

```text
allocatedDirectSeatCount = count(district where validFirstVotes > 0)
unallocatedDirectSeatCount = 299 - allocatedDirectSeatCount

totalSeats[P] = directSeats[P] + listSeats[P]
totalSeats = allocatedDirectSeatCount + 299
majorityThreshold = floor(totalSeats / 2) + 1
```

The 299 direct seats are maximum institutional capacity, not an always-filled block. Unallocated direct seats are explanatory metadata and are not included in `totalSeats`.

Example: six empty districts produce 293 direct seats plus 299 list seats, totaling 592 seats. The majority threshold is 297.

An inactive state leaves all of its district seats unallocated and receives no list seats.

## 11. Data audit

| Required input | Source/status | Decision |
| --- | --- | --- |
| District second votes by party | `public/data/second_votes.json` | Aggregate by state and nation; retain valid-vote totals for the threshold denominator |
| District first votes by party | `public/data/first_votes.json` | Sufficient for winners and first-vote-share ranking; preserve empty districts |
| District-to-state mapping | derivable from vote records | Do not add a duplicate mapping |
| Historical state seat contingents | new small JSON fixture | Store explicit integer seat counts for all states and supported election years; do not store population as calculator input |
| National-minority status | calculator configuration | Mark SSW as exempt |
| Candidate/list positions | absent, intentionally out of scope | Aggregate counts remain calculable |
| Independent candidates | unsupported | Return a typed error if introduced |
| Golden outputs | typed fixtures/tests to add | Use section 12 |

No additional population statistics are needed for gender, age, voting method, state inclusion, or any other ordinary filter.

### Direct-win audit target

The unfiltered archived 2021 data must produce:

| Party | Direct wins |
| --- | ---: |
| SPD | 121 |
| CDU | 98 |
| GRÜNE | 16 |
| AfD | 16 |
| CSU | 45 |
| DIE LINKE | 3 |
| FDP | 0 |
| SSW | 0 |
| **Total** | **299** |

Filtered scenarios assert:

```text
sum_P directWins[P] = count(district where validFirstVotes > 0)
```

## 12. Deterministic reference scenarios

### R1 — archived unfiltered 2021 election

| Party | `de-2021-bwahlg` | `de-2023-fixed-630` | `union-parallel` total | Direct | List |
| --- | ---: | ---: | ---: | ---: | ---: |
| SPD | 206 | 177 | 205 | 121 | 84 |
| CDU | 152 | 130 | 160 | 98 | 62 |
| GRÜNE | 118 | 101 | 64 | 16 | 48 |
| FDP | 92 | 79 | 38 | 0 | 38 |
| AfD | 83 | 72 | 50 | 16 | 34 |
| CSU | 45 | 36 | 62 | 45 | 17 |
| DIE LINKE | 39 | 34 | 19 | 3 | 16 |
| SSW | 1 | 1 | 0 | 0 | 0 |
| **Total** | **736** | **630** | **598** | **299** | **299** |

The 630-seat column matches `scripts/tests/reference_2021.py`.

### R2 — winner changes under a filter

```text
unfiltered first votes: A=600, B=400
modeled first votes:    A=300, B=800
```

B wins in all three strategies. State activity, state seat contingents, district membership, and institutional capacities remain unchanged.

### R3 — minority exemption is not a guarantee

A configured national-minority party below 5% is admitted to list apportionment but may still receive zero seats in a small tier.

### R4 — one or two wins below the threshold

A non-minority party below 5% with two direct wins receives:

- two direct seats and no proportional seats under `de-2021-bwahlg`;
- zero seats and two uncovered wins under `de-2023-fixed-630`;
- two direct-tier seats and no list seats under `union-parallel`.

### R5 — deterministic positive ties

Positive district ties use stable party order and emit `DISTRICT_TIE_REPLACED_BY_STABLE_ORDER`. Sainte-Laguë quotient ties use stable keys and emit `LEGAL_LOT_REPLACED_BY_STABLE_ORDER`.

### R6 — empty district

A district with zero first votes has no winner in any system.

- historical system remains at least 598 seats;
- fixed system remains at 630 seats;
- parallel system has one fewer actual direct and total seat;
- no tie-break is invoked.

### R7 — inactive state

An excluded state has zero first and second votes while remaining present with its districts and historical contingent.

- historical system assigns no preliminary party seats or direct minima in that state and remains at least 598 seats nationally;
- fixed system assigns no direct or list seats to that state and still fills all 630 seats;
- parallel system leaves the state's district seats unallocated, keeps 299 list seats, and reduces actual chamber size accordingly.

### R8 — inconsistent state activity

A normalized state with first votes but no second votes, or vice versa, returns `INCONSISTENT_STATE_ACTIVITY`. Calculators do not contain a fallback for an unsupported vote-type-only scenario.

### R9 — all votes removed

A scenario with zero valid second votes returns `NO_VALID_SECOND_VOTES`. No calculator invents a proportional allocation.

## 13. Shared aggregate contract

Domain results contain stable keys and structured values only. Localized messages belong to the presentation layer.

```ts
type ElectoralSystemId =
  | 'de-2021-bwahlg'
  | 'de-2023-fixed-630'
  | 'union-parallel'

type ElectoralSystemError = {
  code:
    | 'UNSUPPORTED_INDEPENDENT_WINNER'
    | 'MISSING_STATE_SEAT_CONTINGENT'
    | 'INVALID_STATE_SEAT_CONTINGENT_FIXTURE'
    | 'INCONSISTENT_STATE_ACTIVITY'
    | 'INCONSISTENT_DIRECT_TIER_SIZE'
    | 'NO_VALID_SECOND_VOTES'
  details?: Record<string, string | number | string[]>
}

type ElectoralSystemWarning = {
  code:
    | 'FILTERED_FIRST_VOTE_MODEL'
    | 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER'
    | 'DISTRICT_TIE_REPLACED_BY_STABLE_ORDER'
    | 'INACTIVE_STATE_SIMULATION'
  details?: Record<string, string | number | string[]>
}

interface ElectoralSystemResult {
  systemId: ElectoralSystemId
  legalVersion: string
  scenarioMode: 'unfiltered-reference' | 'filtered-model'

  totalSeats: number
  majorityThreshold: number

  parties: Array<{
    party: PartySlug
    secondVotes: number
    eligibleForListSeats: boolean
    totalSeats: number
    directWins: number
    directSeats: number
    listSeats: number
    uncoveredDistrictWins: number
  }>

  warnings: ElectoralSystemWarning[]

  metadata: {
    institutionalSeatCapacity: number
    allocatedDirectSeatCount: number
    emptyDistrictCount: number
    fixedListSeatCount?: number
    maximumDirectSeatCount?: number
    unallocatedDirectSeatCount?: number
    reservedDirectSeats: number
    uncompensatedOverhangSeats: number
    inactiveStates: StateSlug[]
    stateSeatContingentYear?: number
    referenceScenario?: 'btw-2021-main-election'
  }
}
```

Common invariants:

```text
majorityThreshold = floor(totalSeats / 2) + 1
totalSeats = sum(parties.totalSeats)
party.totalSeats = party.directSeats + party.listSeats
party.directWins = party.directSeats + party.uncoveredDistrictWins
sum(parties.directWins) = metadata.allocatedDirectSeatCount
metadata.emptyDistrictCount = 299 - metadata.allocatedDirectSeatCount
```

System-specific invariants:

```text
de-2021-bwahlg:
  totalSeats >= 598
  uncoveredDistrictWins = 0
  stateSeatContingentYear is present

de-2023-fixed-630:
  totalSeats = 630
  reservedDirectSeats = 0
  uncompensatedOverhangSeats = 0

union-parallel:
  fixedListSeatCount = 299
  totalSeats = allocatedDirectSeatCount + fixedListSeatCount
  unallocatedDirectSeatCount =
    maximumDirectSeatCount - allocatedDirectSeatCount
  uncoveredDistrictWins = 0
```

Party arrays are sorted by `totalSeats` descending, then stable party slug.

The UI consumes `totalSeats` and `majorityThreshold` from the result. It must not infer them from nominal or maximum seat counts.

## 14. Consequences for later stories

- #38 creates the calculator interface, registry, normalized scenario adapter, state-activity validation, eligibility helper, Sainte-Laguë primitive, and shared district-winner resolver.
- #39 implements fixed-630 allocation, direct-seat coverage, inactive-state behavior, and scenario-dependent direct-win totals.
- #40 implements independent tiers with a maximum of 299 direct seats, exactly 299 list seats, unallocated-direct-seat metadata, and variable actual chamber size.
- #41 adds and validates the explicit historical state-seat-contingent JSON fixture and implements the legacy allocation. It must not add population or demographic-filter-specific population datasets.
- #42 consumes only `ElectoralSystemResult`, localizes error and warning codes, and never recalculates majority thresholds.
- Tests must cover R6–R9 in addition to the unfiltered reference fixtures.

## 15. Primary references

- Federal Returning Officer, final main-election result 2021: https://www.bundeswahlleiterin.de/info/presse/mitteilungen/bundestagswahl-2021/52_21_endgueltiges-ergebnis.html
- Federal Returning Officer, 2021 state seat contingents: https://www.bundeswahlleiterin.de/mitteilungen/bundestagswahlen/2021/20210909_btw21-sitzkontingente.html
- Federal Returning Officer, explanation of the 2021 seat-allocation procedure: https://www.bundeswahlleiterin.de/dam/jcr/e9eb08cc-e19e-4caa-b9f7-c69247872344/btw21_erl_sitzzuteilung.pdf
- Federal Returning Officer, model calculation for the 2023 law and 2024 court order: https://www.bundeswahlleiterin.de/dam/jcr/05f98632-634d-4582-8507-ab3267d66c01/bwg2025_sitzberechnung_erg2021.pdf
- Federal Constitutional Court, judgment of 30 July 2024 on the 2023 reform: https://www.bundesverfassungsgericht.de/SharedDocs/Pressemitteilungen/EN/2024/bvg24-064.html
- CDU/CSU proposal for independent 299-seat direct and list tiers: https://www.cducsu.de/sites/default/files/2019-11/Brief%20an%20Dr.%20Wolfgang%20Schaeuble_Wahlrechtsreform.pdf
