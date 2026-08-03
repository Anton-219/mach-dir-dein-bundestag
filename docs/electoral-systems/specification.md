# Supported electoral-system variants

Status: normative architecture specification for issue #37 and the implementation stories in epic #36.

This document defines the legal variants, modeling assumptions, required data, filter semantics, deterministic reference scenarios, and aggregate output contract. Later stories may refine implementation details, but must not silently change these decisions.

## 1. Scope and terminology

The project supports exactly these calculator identifiers:

| `systemId` | Variant | Legal/modeling reference |
| --- | --- | --- |
| `de-2021-bwahlg` | Electoral law used for the Bundestag election on 26 September 2021 | Bundeswahlgesetz as amended on 14 November 2020, including up to three uncompensated overhang seats |
| `de-2023-fixed-630` | Fixed-size law introduced in 2023 | Bundeswahlgesetz as amended on 8 June 2023, with the Federal Constitutional Court's transitional three-constituency rule of 30 July 2024 |
| `union-parallel` | Configurable parallel/Grabenwahl model | The CDU/CSU 299 direct + 299 list-seat proposal; both tiers are independent |

A **direct win** is the modeled first-vote plurality in a district that contains at least one modeled valid first vote. A **direct seat** is a direct win that actually receives a Bundestag seat.

Every direct win becomes a seat in the parallel model. Under the 2021 law this is also true, including for a party that wins only one or two districts but fails the list threshold. Under the 2023 law a plurality can remain uncovered.

An **empty district** is a district whose modeled valid first-vote total is zero. It has no winner and therefore no direct win. An **inactive state** is a state whose modeled first- and second-vote totals are both zero. It remains part of Germany, retains its population fixture and districts, and is not removed from the electoral territory.

The result is party-level only. Candidate names, list positions, biographies, and statements about which individual candidate enters parliament are outside the epic.

## 2. Shared scenario boundary

Vote filtering and seat allocation are separate stages:

1. The scenario builder applies demographic and regional filters to second votes.
2. The first-vote model applies the same active filters to first votes, using the repository's ratio-based interpolation and clamping rules.
3. The scenario is normalized once.
4. Every electoral-system strategy receives that same normalized scenario.
5. Each strategy applies only eligibility and seat-allocation rules.

No strategy may read UI state, repeat demographic interpolation, load JSON files directly, derive population from the filtered electorate, remove states, or alter district boundaries.

A normalized scenario must always retain all 16 states and all 299 districts, including states and districts with zero modeled votes:

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
    validFirstVotes: number
    validSecondVotes: number
    secondVotesByParty: Record<PartySlug, number>
    germanPopulation?: number
  }>
  districts: Array<{
    districtId: number
    state: StateSlug
    validFirstVotes: number
    firstVotesByParty: Record<PartySlug, number>
  }>
}
```

`germanPopulation` is required only by `de-2021-bwahlg`. It is a frozen legal input and must be identical for filtered and unfiltered scenarios. The other strategies must not depend on population data.

A scenario with zero valid second votes nationwide cannot perform a proportional allocation and returns typed error `NO_VALID_SECOND_VOTES`. Zero first votes nationwide are valid: they simply produce no district winners.

## 3. Meaning of filters

Filters model **non-participation**, not a changed population or electoral territory.

For every demographic, voting-method, state, or district filter:

- only matching first and second votes remain in the modeled vote totals;
- state population remains unchanged;
- all states remain present;
- all 299 districts and their boundaries remain present;
- no district is transferred to another state;
- no institutional seat capacity is recalculated from the filtered group.

For example, selecting only voters aged 18–24 means: “What if only this group had cast votes?” It does not mean that Germany's population consists only of this group.

Excluding a state means: “The state remains part of Germany, but no votes from it are counted.” It does not remove the state, its population, or its districts from the model.

A future simulation of changed state borders, population bases, district maps, or institutional seat capacities is a separate feature and must not be implemented as ordinary filter behavior.

## 4. District-winner resolution

Winner resolution is shared by all calculators and happens before system-specific seat allocation.

For district `d`, let:

```text
E[d] = sum_P firstVotes[P,d]
```

Then:

```text
if E[d] == 0:
  winner[d] = none
else:
  winner[d] = argmax_P(firstVotes[P,d])
```

A zero-vote district must never receive an artificial winner through array order, party slug, random choice, or the general tie-break rule.

If two or more parties tie with the same positive maximum, resolve the tie by ascending stable party slug. Emit warning `DISTRICT_TIE_REPLACED_BY_STABLE_ORDER`. This is a deterministic simulation convention, not a reproduction of a legal lot.

The set and count of direct wins are therefore scenario-dependent:

```text
allocatedDistrictCount = count(district where validFirstVotes > 0)
emptyDistrictCount = 299 - allocatedDistrictCount
sum_P directWins[P] = allocatedDistrictCount
```

For the unfiltered 2021 reference, `allocatedDistrictCount = 299`.

## 5. Eligibility and special cases

A party participates in proportional/list-seat allocation when at least one condition is true:

- it receives at least 5% of all valid second votes nationwide;
- it has the most first votes in at least three non-empty districts; or
- it is configured as a party of a national minority.

The denominator is all valid second votes, including votes for parties that later fail the threshold.

Minority status is explicit legal metadata, not inferred from vote totals or direct wins. For the 2021 data, `SSW` has `isNationalMinorityParty: true`. The exemption only admits SSW to apportionment; it does not guarantee a seat.

A party below 5% with only one or two direct wins is handled differently by each system:

- `de-2021-bwahlg`: its direct winners receive seats, but its second votes do not participate in proportional allocation.
- `de-2023-fixed-630`: it receives no party seats; its district pluralities are uncovered because the party has no second-vote allocation.
- `union-parallel`: its direct winners receive direct-tier seats, but the party receives no list-tier seats.

Successful independent candidates are separate legal cases under both German statutes. The project has no candidate-level independent-vote contract and the 2021 reference election had no successful independent candidate. A scenario containing one must return typed error `UNSUPPORTED_INDEPENDENT_WINNER` rather than silently misallocate seats.

## 6. Common apportionment primitive

All proportional allocations use Sainte-Laguë/Schepers, the divisor method with standard rounding.

For vote total `v_i` and divisor `d`:

```text
seats_i = roundHalfUp(v_i / d)
```

Choose `d` so that the rounded seat counts sum to the required seat count. An equivalent highest-averages implementation may award successive seats using quotients `v_i / (2 * seats_i + 1)`.

German law resolves an exact allocation tie by lot. The application must be deterministic, so an exact quotient tie is resolved by ascending stable party slug, then ascending state slug or district id where needed. Emit warning `LEGAL_LOT_REPLACED_BY_STABLE_ORDER` whenever this fallback is used.

An allocation with a positive seat count and no positive votes is invalid. It must not invent recipients by stable ordering.

## 7. `de-2021-bwahlg`

### 7.1 Size and mandate rules

- Nominal size: 598 seats.
- District map: 299 fixed districts.
- Every modeled district winner receives a direct seat.
- An empty district produces no direct seat.
- Empty districts do not reduce the 598-seat nominal size.
- Overhang and compensation can increase the final size.
- Up to three overhang seats may remain uncompensated in total.

The final chamber therefore remains:

```text
totalSeats >= 598
```

even when fewer than 299 districts produce winners.

### 7.2 Population basis

The initial state contingents always use the frozen German state population as of 31 May 2021.

Filters never recalculate these population values. In particular, demographic exclusions and inactive states do not reduce a state's population basis. This prevents the ordinary vote-filter feature from becoming a population or district-map simulation.

### 7.3 Allocation formula

Let `L` be a state, `P` a party, `D[P,L]` its direct wins in that state, and `Z[P,L]` its state second votes.

1. **Reserved direct seats.** Let `R` be the number of direct wins by parties that are not eligible for proportional allocation. Reserve those seats and exclude those parties' second votes from all following proportional steps.
2. **State contingents.** Allocate `598 - R` preliminary seats among the 16 states by frozen German population using Sainte-Laguë/Schepers.
3. **First state allocation.**
   - If a state has positive valid second votes, allocate its contingent among eligible state lists by `Z[P,L]` using Sainte-Laguë/Schepers. Call this `A[P,L]`.
   - If a state has zero valid second votes, set `A[P,L] = 0` for all parties. Do not invent a recipient for its population-based contingent.
4. **State minimum.** For every eligible party/list calculate:

   ```text
   stateMinimum[P,L] = max(
     D[P,L],
     floor((D[P,L] + A[P,L]) / 2 + 0.5)
   )
   ```

   A completely inactive state has `D[P,L] = 0` and `A[P,L] = 0`, so it creates no minimum. If a state exceptionally has first votes but no second votes, its real modeled direct wins still create direct-seat minima; zero second votes alone do not erase a winner.
5. **National minimum.** Calculate:

   ```text
   partyMinimum[P] = max(
     sum_L(stateMinimum[P,L]),
     sum_L(A[P,L])
   )
   ```
6. **Upper allocation and chamber expansion.** Starting at final chamber size `T = 598`, find the smallest `T` for which there is an integer residual-overhang count `u` from 0 through 3 such that:
   - `T - R - u` seats can be allocated nationally among eligible parties by second votes using Sainte-Laguë/Schepers;
   - the sum of positive deficits between that allocation and `partyMinimum[P]` is exactly `u`; and
   - adding each party's deficit satisfies every `partyMinimum[P]`.

   The reserved seats and deficits are then added to the proportional allocation. For the unfiltered 2021 reference, `R = 0`: 733 seats are distributed proportionally and three residual CSU overhang seats produce 736 seats in total.
7. **Final state allocation.** Allocate each eligible party's national total among its state lists by state second votes using Sainte-Laguë/Schepers, subject to each `stateMinimum[P,L]` as a lower bound. A state list with zero second votes receives no list seat unless a positive direct-seat lower bound requires the party's direct seats there.
8. **Party breakdown.** For an eligible party, `directSeats = directWins` and `listSeats = totalSeats - directSeats`. For a non-eligible party with reserved wins, `totalSeats = directSeats = directWins` and `listSeats = 0`.

The zero-second-vote state treatment is an explicit simulation convention for a situation not expected in a real federal election. Emit warning `ZERO_SECOND_VOTE_STATE_SIMULATION` with the affected state slugs.

The calculator requires state-level German population as of 31 May 2021. Resident population and adult-citizen population are not legal substitutes.

### 7.4 Majority threshold

```text
majorityThreshold = floor(totalSeats / 2) + 1
```

It is computed from the actual expanded chamber size and is never hard-coded to 300 or 369.

## 8. `de-2023-fixed-630`

### 8.1 Size and mandate rules

- Fixed size: 630 seats.
- District map: 299 fixed districts.
- No overhang or compensation seats.
- A district plurality becomes a direct seat only when covered by the party's state-level second-vote allocation.
- An empty district has no winner and therefore cannot be covered or uncovered.
- Empty districts and inactive states do not reduce the chamber size.

```text
totalSeats = 630
majorityThreshold = 316
```

### 8.2 Allocation formula

1. Allocate all 630 seats nationally among eligible parties by nationwide second votes using Sainte-Laguë/Schepers.
2. For each party, allocate its national seats among its state lists by state second votes using Sainte-Laguë/Schepers. State lists with zero second votes receive zero seats.
3. In each party/state combination, rank district winners by descending first-vote share:

   ```text
   firstVoteShare = partyFirstVotes / validFirstVotesInDistrict
   ```

   Only non-empty districts enter this ranking.
4. The first `stateSeats[P,L]` winners in that ranking receive direct seats. Remaining state seats go to the state list. Excess district winners are uncovered. A direct win by a non-eligible party is also uncovered.
5. Return aggregate counts only:

   ```text
   directSeats = covered district wins
   uncoveredDistrictWins = directWins - directSeats
   listSeats = totalSeats - directSeats
   ```

No candidate names or list positions are required for these aggregate counts.

An inactive state produces no district winners and no state-list seats. The 630 seats are nevertheless fully allocated from the remaining nationwide second votes; no seat remains vacant.

The supported variant includes the Federal Constitutional Court's transitional three-constituency rule. It intentionally does not model the June 2023 statute as if the later court order had never occurred.

## 9. `union-parallel`

“Grabenwahl” is not one unique formula. This project selects the Union's parallel 299+299 proposal and exposes its configuration together with an explicit simulation rule for empty districts.

Default configuration:

```ts
interface ParallelSystemConfig {
  maximumDirectSeatCount: 299
  fixedListSeatCount: 299
  listEligibility: 'shared-threshold-rules'
}
```

Allocation:

1. Resolve a winner in each non-empty configured district. Every such winner receives a direct-tier seat.
2. An empty district awards no direct seat. The seat is not transferred, reassigned, or converted into a list seat.
3. Independently allocate exactly `fixedListSeatCount` seats among eligible parties by nationwide second votes using Sainte-Laguë/Schepers.
4. Allocate each party's list seats among its state lists by state second votes. A state list with zero second votes receives no list seat.
5. Do not offset the tiers:

   ```text
   allocatedDirectSeatCount = count(district where validFirstVotes > 0)
   unallocatedDirectSeatCount =
     maximumDirectSeatCount - allocatedDirectSeatCount

   totalSeats[P] = directSeats[P] + listSeats[P]
   totalChamberSize = allocatedDirectSeatCount + fixedListSeatCount
   majorityThreshold = floor(totalChamberSize / 2) + 1
   ```

6. There are no overhang or compensation seats.

`maximumDirectSeatCount` is institutional capacity, not an always-filled block. The actual direct tier can be smaller. Unallocated direct seats are explanatory metadata and are not included in `totalChamberSize`.

With the current dataset, `maximumDirectSeatCount` must equal the number of districts, 299. A different value requires a matching district-boundary and first-vote dataset; reject inconsistent configuration.

Example: if six districts are empty, the result contains 293 direct seats and 299 list seats, for 592 actual seats and a majority threshold of 297.

An inactive state leaves all of its district seats unallocated and receives no list seats. This is a project simulation convention for a proposal that does not define this filtered-data edge case.

## 10. Data audit

| Required input | Current repository source | Status | Decision/limitation |
| --- | --- | --- | --- |
| District second votes by party | `public/data/second_votes.json` | available | Aggregate by state and nation; retain `validVotes` for the 5% denominator |
| District first votes by party | `public/data/first_votes.json` | available | Sufficient for winners and first-vote-share ranking; preserve zero-vote districts |
| District-to-state mapping | first/second-vote records | available | No separate mapping file required |
| State second votes by party | derived from district second votes | derivable | Do not add a duplicate dataset |
| Direct totals by party/state | derived from non-empty district winners | derivable | Do not add a duplicate direct-mandate file |
| German population by state on 31 May 2021 | not represented by the current population contract | missing | Add one small frozen dataset; do not add demographic-filter-specific population fixtures |
| National-minority party flag | no legal metadata in vote files | missing | Add calculator configuration; mark SSW as exempt |
| Candidate/list positions | absent | intentionally out of scope | Aggregate direct/list counts remain calculable |
| Independent candidates | absent | unsupported | Return a typed error if introduced |
| Golden reference outputs | not yet a typed fixture | missing | Add fixtures/tests in #38 and system stories using section 11 |

The current `populations.json` contains district residents and citizens aged 18 or older. Neither matches the 2021 law's state-level German-population input.

No additional population statistics are needed for gender, age, voting method, state inclusion, or any other ordinary filter. Filters affect votes only.

### Direct-mandate audit target

The archived final result of the main election on 26 September 2021 contains exactly 299 district wins:

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

The data-generation scripts already validate 299 district records. The engine's first real-data regression test must additionally assert the party totals above for an unfiltered scenario. A mismatch is a data/model defect, not an electoral-system difference.

Filtered scenarios must instead assert:

```text
sum_P directWins[P] =
  count(district where validFirstVotes > 0)
```

## 11. Deterministic reference scenarios

### R1 — archived unfiltered 2021 main election

Use the repository's original 26 September 2021 result, not the 2024 partial repeat election in Berlin. Disable every filter.

Eligible parties are SPD, CDU, GRÜNE, FDP, AfD, CSU, DIE LINKE through three direct wins, and SSW through the national-minority exemption.

| Party | `de-2021-bwahlg` | `de-2023-fixed-630` | `union-parallel` total | Parallel direct | Parallel list |
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

The 630-seat column matches `scripts/tests/reference_2021.py`. The 299-list-seat column is a deterministic Sainte-Laguë/Schepers recalculation from the archived nationwide second-vote totals. SSW participates in both but does not reach one seat in the smaller 299-seat list tier.

For unfiltered `de-2023-fixed-630`, later tests must also assert:

```text
sum(directSeats) + sum(listSeats) = 630
sum(uncoveredDistrictWins) + sum(directSeats) = 299
```

The exact covered/uncovered party breakdown is frozen by #39 after state allocation and first-vote-share ranking are implemented against repository data.

### R2 — first-vote winner changes under a filter

```text
unfiltered first votes: A=600, B=400, valid=1,000
scenario multipliers:   A=0.5, B=2.0
modeled first votes:    A=300, B=800
```

Expected winner is B in all three strategies. The 2021 and parallel strategies count one B direct seat. The 2023 strategy counts one B direct win and covers it only if B has a state seat.

Population fixtures, state membership, district membership, and institutional seat capacities remain unchanged.

### R3 — minority exemption is eligibility, not a guarantee

A configured national-minority party below 5% with no direct wins is included in Sainte-Laguë input. Its result may still be zero when the tier is too small. This protects SSW from both accidental exclusion and an artificial seat guarantee.

### R4 — one or two wins below the threshold

A non-minority party below 5% with two district wins receives two seats under `de-2021-bwahlg`, zero seats and two uncovered wins under `de-2023-fixed-630`, and two direct-tier seats under `union-parallel`. It receives no proportional/list seats in any variant.

### R5 — deterministic positive tie handling

An exact positive district tie resolves by stable party slug and emits `DISTRICT_TIE_REPLACED_BY_STABLE_ORDER`. An exact Sainte-Laguë quotient tie resolves by stable key order and emits `LEGAL_LOT_REPLACED_BY_STABLE_ORDER`. Repeated calculations with identical input must be byte-for-byte equal.

### R6 — empty district

```text
first votes in district: all parties = 0
valid first votes: 0
```

Expected behavior:

- no winner and no direct win in any system;
- `de-2021-bwahlg` still starts from 598 seats;
- `de-2023-fixed-630` still returns 630 seats;
- `union-parallel` allocates one fewer direct seat and therefore has one fewer actual seat;
- the stable tie-break is not invoked.

### R7 — inactive state

For a state with zero modeled first and second votes:

- population and districts remain present in the normalized scenario;
- `de-2021-bwahlg` retains the frozen population basis, assigns no preliminary party seats in that state, creates no direct minimum there, and still allocates a final chamber of at least 598 seats nationally;
- `de-2023-fixed-630` assigns no direct or list seats to that state and still allocates all 630 seats;
- `union-parallel` leaves that state's district seats unallocated, keeps all 299 list seats, and reduces actual chamber size by the number of its empty districts.

### R8 — all second votes removed

A scenario with `validSecondVotes = 0` returns `NO_VALID_SECOND_VOTES` for all three systems. No calculator invents a proportional allocation by stable ordering.

## 12. Shared aggregate contract

A calculation returns either `ElectoralSystemResult` or a typed `ElectoralSystemError`. Domain results contain stable keys and structured values only; localized messages belong to the presentation layer.

```ts
type ElectoralSystemId =
  | 'de-2021-bwahlg'
  | 'de-2023-fixed-630'
  | 'union-parallel'

type ElectoralSystemError = {
  code:
    | 'UNSUPPORTED_INDEPENDENT_WINNER'
    | 'MISSING_STATE_POPULATION'
    | 'INCONSISTENT_DIRECT_TIER_SIZE'
    | 'NO_VALID_SECOND_VOTES'
  details?: Record<string, string | number | string[]>
}

type ElectoralSystemWarning = {
  code:
    | 'FILTERED_FIRST_VOTE_MODEL'
    | 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER'
    | 'DISTRICT_TIE_REPLACED_BY_STABLE_ORDER'
    | 'ZERO_SECOND_VOTE_STATE_SIMULATION'
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
    referenceScenario?: 'btw-2021-main-election'
  }
}
```

Invariants:

```text
majorityThreshold = floor(totalSeats / 2) + 1
totalSeats = sum(parties.totalSeats)
party.totalSeats = party.directSeats + party.listSeats
party.directWins = party.directSeats + party.uncoveredDistrictWins
sum(parties.directWins) = metadata.allocatedDirectSeatCount
metadata.emptyDistrictCount =
  299 - metadata.allocatedDirectSeatCount
```

System-specific invariants:

```text
de-2021-bwahlg:
  totalSeats >= 598
  uncoveredDistrictWins = 0

de-2023-fixed-630:
  totalSeats = 630
  reservedDirectSeats = 0
  uncompensatedOverhangSeats = 0

union-parallel:
  fixedListSeatCount = 299
  totalSeats =
    allocatedDirectSeatCount + fixedListSeatCount
  unallocatedDirectSeatCount =
    maximumDirectSeatCount - allocatedDirectSeatCount
  uncoveredDistrictWins = 0
```

Party arrays are sorted by `totalSeats` descending, then stable party slug.

The UI consumes `totalSeats` and `majorityThreshold` from the result. It must not assume 598, 630, 736, 300, 316, or any other fixed majority threshold.

## 13. Consequences for later stories

- #38 creates an `ElectoralSystemCalculator` strategy interface, registry, normalized scenario adapter, eligibility helper, Sainte-Laguë primitive, and shared district-winner resolver that returns no winner for zero-vote districts.
- #39 implements the 630-seat upper/lower allocation, aggregate direct-seat coverage, inactive-state behavior, and scenario-dependent direct-win totals.
- #40 implements independent tiers with a maximum of 299 direct seats, exactly 299 list seats, unallocated-direct-seat metadata, and a variable actual chamber size.
- #41 adds the frozen 31 May 2021 German state-population fixture, the four-stage legacy allocation, and the zero-second-vote state simulation convention. It must not add demographic-filter-specific population datasets.
- #42 consumes only `ElectoralSystemResult`; it must not know formulas, infer seat capacity, or recalculate the majority threshold. It localizes error and warning codes through the i18n catalogs.
- Tests for every implementation story must cover R6–R8 in addition to the unfiltered reference fixtures.

## 14. Primary references

- Federal Returning Officer, final main-election result 2021: https://www.bundeswahlleiterin.de/info/presse/mitteilungen/bundestagswahl-2021/52_21_endgueltiges-ergebnis.html
- Federal Returning Officer, explanation of the 2021 seat-allocation procedure: https://www.bundeswahlleiterin.de/dam/jcr/e9eb08cc-e19e-4caa-b9f7-c69247872344/btw21_erl_sitzzuteilung.pdf
- Federal Returning Officer, model calculation for the 2023 law and 2024 court order: https://www.bundeswahlleiterin.de/dam/jcr/05f98632-634d-4582-8507-ab3267d66c01/bwg2025_sitzberechnung_erg2021.pdf
- Federal Constitutional Court, judgment of 30 July 2024 on the 2023 reform: https://www.bundesverfassungsgericht.de/SharedDocs/Pressemitteilungen/EN/2024/bvg24-064.html
- CDU/CSU proposal for independent 299-seat direct and list tiers: https://www.cducsu.de/sites/default/files/2019-11/Brief%20an%20Dr.%20Wolfgang%20Schaeuble_Wahlrechtsreform.pdf