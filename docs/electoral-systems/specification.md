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

“Direct win” means the party with the largest modeled first-vote total in a district. “Direct seat” means a direct win that actually receives a Bundestag seat. These are identical in the 2021 and parallel models, but not under the 2023 fixed-size law.

The result is party-level only. Candidate names, list positions, biographies, and statements about which individual candidate enters parliament are outside the epic.

## 2. Shared scenario boundary

Vote filtering and seat allocation are separate stages:

1. The existing scenario builder applies demographic and regional filters to second votes.
2. The existing first-vote model applies the same active filters to first votes, using the repository's ratio-based interpolation and clamping rules.
3. The scenario is normalized once.
4. Every electoral-system strategy receives that same normalized scenario.
5. Each strategy applies only eligibility and seat-allocation rules.

No strategy may read UI state, repeat demographic interpolation, or load JSON files directly.

A normalized scenario must expose at least:

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

`germanPopulation` is required only by `de-2021-bwahlg`. The other strategies must not depend on it.

## 3. Shared eligibility rules

Unless a strategy explicitly overrides a rule, a party participates in proportional/list-seat allocation when at least one condition is true:

- it receives at least 5% of all valid second votes nationwide;
- it has the most first votes in at least three districts; or
- it is configured as a party of a national minority.

The denominator is all valid second votes, including votes for parties that later fail the threshold.

Minority status is an explicit party attribute, not inferred from vote totals or direct wins. For the 2021 data, `SSW` has `isNationalMinorityParty: true`. Exemption from the threshold does not guarantee a seat; the party must still receive enough votes to obtain a seat in the relevant apportionment.

Direct wins by non-eligible parties behave as follows:

- `de-2021-bwahlg`: the three-direct-win condition makes such a party eligible; a party with fewer direct wins is outside the supported 2021 party-list baseline.
- `de-2023-fixed-630`: the same transitional three-direct-win condition applies until the legislature replaces it.
- `union-parallel`: every district winner receives a direct-tier seat, while eligibility controls only the independent list tier.

Successful independent candidates are a legal special case in both German statutes. The project has no candidate-level data and the 2021 reference election had no successful independent candidate. Independent winners are therefore unsupported; a scenario containing one must fail with a typed `UNSUPPORTED_INDEPENDENT_WINNER` error rather than silently misallocate seats.

## 4. Common apportionment primitive

All proportional allocations use Sainte-Laguë/Schepers (divisor method with standard rounding).

For vote total `v_i` and divisor `d`:

```text
seats_i = roundHalfUp(v_i / d)
```

Choose `d` so that the rounded seat counts sum to the required number of seats. An equivalent highest-averages implementation may award successive seats using quotients `v_i / (2 * seats_i + 1)`.

German law resolves an exact allocation tie by lot. The application must be deterministic, so an exact quotient tie is resolved by ascending stable party slug, then ascending state slug where needed. The result must contain warning `LEGAL_LOT_REPLACED_BY_STABLE_ORDER`. This is the only deliberate deviation from the legal tie procedure.

## 5. `de-2021-bwahlg`

### 5.1 Size and direct mandates

- Nominal size: 598 seats.
- Districts: 299.
- Every district winner receives a direct seat.
- Overhang and compensation can increase the final size.
- Up to three overhang seats may remain uncompensated in total.

### 5.2 Allocation formula

Let `L` be a state, `P` a party, `D[P,L]` its direct wins in that state, and `Z[P,L]` its state second votes.

1. **State contingents.** Allocate 598 preliminary seats among the 16 states by German population using Sainte-Laguë/Schepers.
2. **First state allocation.** In each state, allocate its contingent among eligible state lists by `Z[P,L]` using Sainte-Laguë/Schepers. Call this `A[P,L]`.
3. **State minimum.** Calculate:

   ```text
   stateMinimum[P,L] = max(
     D[P,L],
     floor((D[P,L] + A[P,L]) / 2 + 0.5)
   )
   ```

4. **National minimum.** Calculate:

   ```text
   partyMinimum[P] = max(
     sum_L(stateMinimum[P,L]),
     sum_L(A[P,L])
   )
   ```

5. **Upper allocation and chamber expansion.** Starting at a final chamber size of 598, find the smallest size `T` for which there is an integer residual-overhang count `u` from 0 through 3 such that:
   - `T - u` seats can be allocated nationally among eligible parties by second votes using Sainte-Laguë/Schepers;
   - the sum of positive deficits to `partyMinimum[P]` is exactly `u`; and
   - adding each party's deficit to its proportional allocation satisfies every `partyMinimum[P]`.

   The deficits are the uncompensated overhang seats. This reproduces the 2021 result: 733 proportionally allocated seats plus three residual CSU overhang seats, for 736 seats in total.
6. **Final state allocation.** Allocate each party's national total among its state lists by state second votes using Sainte-Laguë/Schepers, subject to each `stateMinimum[P,L]` as a lower bound.
7. **Party breakdown.** `directSeats` is the number of district wins; `listSeats = totalSeats - directSeats`.

The 2021 calculator requires state-level German population as of 31 May 2021. Resident population and adult-citizen population are not legal substitutes.

## 6. `de-2023-fixed-630`

### 6.1 Size and direct mandates

- Fixed size: 630 seats.
- Districts: 299.
- No overhang or compensation seats.
- A district plurality is a direct win, but becomes a direct seat only when covered by the party's state-level second-vote allocation.

### 6.2 Allocation formula

1. Allocate all 630 seats nationally among eligible parties by nationwide second votes using Sainte-Laguë/Schepers.
2. For each party, allocate its national seats among its state lists by state second votes using Sainte-Laguë/Schepers.
3. In each party/state combination, rank district winners by descending first-vote share:

   ```text
   firstVoteShare = partyFirstVotes / validFirstVotesInDistrict
   ```

4. The first `stateSeats[P,L]` district winners in that ranking receive direct seats. Remaining seats go to the state list. If there are more district winners than state seats, the lowest-ranked winners are uncovered and receive no seat.
5. Return aggregate counts only:

   ```text
   directSeats = covered district wins
   uncoveredDistrictWins = district wins - directSeats
   listSeats = totalSeats - directSeats
   ```

No candidate names or list positions are required to calculate those aggregate counts.

The supported variant includes the Federal Constitutional Court's transitional rule: a party below 5% remains eligible when it wins at least three districts. This is intentionally more precise than modeling the statute exactly as enacted in June 2023 without the later court order.

## 7. `union-parallel`

This project selects the Union's parallel 299+299 proposal as the precise Grabenwahl variant. “Grabenwahl” is not one unique formula, so the identifier must never be used without its configuration.

Default configuration:

```ts
interface ParallelSystemConfig {
  directSeatCount: 299
  listSeatCount: 299
  listEligibility: 'shared-threshold-rules'
}
```

Allocation:

1. Determine one winner in each configured district. Every winner receives a direct-tier seat.
2. Independently allocate `listSeatCount` seats among eligible parties by nationwide second votes using Sainte-Laguë/Schepers.
3. The tiers do not offset each other:

   ```text
   totalSeats[P] = directSeats[P] + listSeats[P]
   totalChamberSize = directSeatCount + listSeatCount
   ```

4. There are no overhang or compensation seats because direct seats are not deducted from proportional seats.

With the current 299-district dataset, `directSeatCount` must equal 299. A different value requires a matching district-boundary and first-vote dataset; the calculator must reject an inconsistent configuration.

## 8. Filter semantics

The preferred baseline written in issue #37 assumed fixed historical direct mandates and filters affecting only second votes. That assumption was superseded before this specification by merged PR #45, which introduced first-vote demographic filtering and district-level direct-mandate recalculation.

The supported behavior is therefore:

- the same demographic and regional inclusion state affects first and second votes;
- direct winners are recalculated for every scenario;
- all three electoral systems receive those same modeled winners and vote totals;
- an unfiltered scenario is an exact historical-data reference;
- a filtered scenario is a pedagogical estimate and must carry warning `FILTERED_FIRST_VOTE_MODEL`.

Electoral-system calculators do not decide how filters influence votes. They consume the normalized result of the existing interpolation model. This keeps later improvements to the first-vote model independent of legal seat-allocation code.

## 9. Data audit

| Required input | Current repository source | Status | Decision/limitation |
| --- | --- | --- | --- |
| District second votes by party | `public/data/second_votes.json` | available | Aggregate by state and nation; retain `validVotes` for the 5% denominator |
| District first votes by party | `public/data/first_votes.json` | available | Sufficient for winners and first-vote-share ranking; generated validation requires all 299 districts |
| District-to-state mapping | first/second-vote records | available | No separate mapping file required |
| State second votes by party | derived from district second votes | derivable | Do not add a duplicate static dataset |
| Direct totals by party/state | derived from district winners | derivable | Do not add a duplicate direct-mandate file |
| German population by state on 31 May 2021 | not represented by current population contract | missing | Add a small, frozen, sourced dataset before implementing `de-2021-bwahlg` |
| National-minority party flag | no legal metadata in vote files | missing | Add calculator configuration; mark SSW as exempt |
| Candidate/list positions | absent | intentionally out of scope | Aggregate direct/list counts remain calculable |
| Independent candidates | absent | unsupported | Fail explicitly if introduced |
| Golden reference outputs | not yet a fixture | missing | Add typed fixtures/tests in #38 and system stories using section 10 |

The current `populations.json` contains district residents and citizens aged 18 or older. Neither value matches the 2021 law's state-level German population input and must not be reused for legal allocation.

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

The data-generation scripts already validate 299 district records. The first real-data regression test added with the engine must additionally assert the party totals above for an unfiltered scenario. A mismatch is a data/model defect, not an electoral-system difference.

## 10. Deterministic reference scenarios

### R1 — archived unfiltered 2021 main election

Use the repository's original 26 September 2021 result, not the 2024 partial repeat election in Berlin. Disable every filter.

Eligible parties are SPD, CDU, GRÜNE, FDP, AfD, CSU, DIE LINKE (three direct wins), and SSW (national-minority exemption).

Expected party totals:

| Party | `de-2021-bwahlg` | `de-2023-fixed-630` | `union-parallel` total | Parallel direct | Parallel list |
| --- | ---: | ---: | ---: | ---: | ---: |
| SPD | 206 | 177 | 205 | 121 | 84 |
| CDU | 152 | 130 | 160 | 98 | 62 |
| GRÜNE | 118 | 102 | 64 | 16 | 48 |
| FDP | 92 | 79 | 38 | 0 | 38 |
| AfD | 83 | 71 | 50 | 16 | 34 |
| CSU | 45 | 36 | 62 | 45 | 17 |
| DIE LINKE | 39 | 34 | 19 | 3 | 16 |
| SSW | 1 | 1 | 0 | 0 | 0 |
| **Total** | **736** | **630** | **598** | **299** | **299** |

The 630-seat and 299-list-seat columns are deterministic Sainte-Laguë/Schepers recalculations from the archived nationwide second-vote totals. SSW is considered in both allocations but does not reach one seat in the smaller 299-seat list tier.

For `de-2023-fixed-630`, later tests must also assert:

```text
sum(directSeats) + sum(listSeats) = 630
sum(uncoveredDistrictWins) + sum(directSeats) = 299
```

The exact aggregate covered/uncovered breakdown is frozen by #39 after state allocation and first-vote-share ranking are implemented against the repository data.

### R2 — first-vote winner changes under a filter

Synthetic district:

```text
unfiltered first votes: A=600, B=400, valid=1,000
scenario multipliers:   A=0.5, B=2.0
modeled first votes:    A=300, B=800
```

Expected winner is B in all three strategies. The 2021 and parallel strategies count one B direct seat. The 2023 strategy counts one B direct win and covers it only if B has a state seat.

### R3 — minority exemption is eligibility, not a guaranteed seat

A configured national-minority party below 5% with no direct wins must be included in the Sainte-Laguë input. Its result may still be zero when the tier is too small. This scenario protects the SSW behavior from both accidental exclusion and an artificial seat guarantee.

### R4 — deterministic tie handling

An exact Sainte-Laguë quotient tie must resolve by stable slug order and emit `LEGAL_LOT_REPLACED_BY_STABLE_ORDER`. Repeated calculations with identical input must be byte-for-byte equal.

## 11. Shared aggregate output contract

Every strategy returns:

```ts
type ElectoralSystemId =
  | 'de-2021-bwahlg'
  | 'de-2023-fixed-630'
  | 'union-parallel'

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
  warnings: Array<{
    code:
      | 'FILTERED_FIRST_VOTE_MODEL'
      | 'LEGAL_LOT_REPLACED_BY_STABLE_ORDER'
      | 'UNSUPPORTED_INDEPENDENT_WINNER'
    message: string
  }>
  metadata: {
    baseSeatCount: number
    directTierSeatCount?: number
    listTierSeatCount?: number
    uncompensatedOverhangSeats: number
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
```

For the 2021 and parallel strategies, `uncoveredDistrictWins` is always zero. For the 2023 strategy, `uncompensatedOverhangSeats` is always zero. Party arrays are sorted by `totalSeats` descending, then stable party slug, so UI comparison never depends on object insertion order.

## 12. Implementation consequences for later stories

- #38 creates an `ElectoralSystemCalculator` strategy interface, registry, normalized scenario adapter, eligibility helper, and Sainte-Laguë primitive.
- #39 implements the 630-seat upper/lower allocation and aggregate direct-seat coverage.
- #40 implements the configurable independent tiers with a default of 299+299.
- #41 adds the missing 31 May 2021 German state-population fixture and the four-stage legacy allocation.
- #42 consumes only `ElectoralSystemResult`; it must not know formulas or recalculate seat counts.

## 13. Primary references

- Federal Returning Officer, final main-election result 2021: https://www.bundeswahlleiterin.de/info/presse/mitteilungen/bundestagswahl-2021/52_21_endgueltiges-ergebnis.html
- Federal Returning Officer, explanation of the 2021 seat-allocation procedure: https://www.bundeswahlleiterin.de/dam/jcr/e9eb08cc-e19e-4caa-b9f7-c69247872344/btw21_erl_sitzzuteilung.pdf
- Federal Returning Officer, model calculation for the 2023 law and the 2024 court order: https://www.bundeswahlleiterin.de/dam/jcr/05f98632-634d-4582-8507-ab3267d66c01/bwg2025_sitzberechnung_erg2021.pdf
- Federal Constitutional Court, judgment of 30 July 2024 on the 2023 reform: https://www.bundesverfassungsgericht.de/SharedDocs/Pressemitteilungen/EN/2024/bvg24-064.html
- CDU/CSU proposal for independent 299-seat direct and list tiers: https://www.cducsu.de/sites/default/files/2019-11/Brief%20an%20Dr.%20Wolfgang%20Schaeuble_Wahlrechtsreform.pdf
