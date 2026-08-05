# Electoral-system calculation architecture

These modules keep vote-scenario preparation, party qualification, proportional allocation, system orchestration, and React presentation separate.

## Shared boundary

- `createElectoralScenarioReference` scans the loaded first- and second-vote records once and records the complete state, district, and party geography. It does not copy or concatenate the large JSON datasets.
- `buildElectoralScenario` aggregates one filtered first- and second-vote scenario while retaining inactive states and empty districts from that reference.
- `validateElectoralScenario` rejects inconsistent vote-type activity, invalid totals, duplicate geography, and mismatched national, state, district, or party totals before a calculator runs.
- `resolveDistrictWinners` is shared by all strategies. Zero-vote districts remain empty. Positive exact ties use the stable party slug order and return a structured warning because the legal lot cannot be reproduced deterministically.
- `allocateSainteLague` allocates any fixed seat pool through the odd-divisor Sainte-Laguë/Schepers method. `allocateSainteLagueWithMinimums` uses the same quotient and tie rules while preserving state-level lower bounds required by the historical law.
- `ElectoralSystemRegistry` selects calculators by the identifiers specified in `docs/electoral-systems/specification.md`. Unknown identifiers and supported-but-unregistered strategies fail separately and clearly.
- Every calculator returns one normalized `ElectoralSystemResult`. The engine validates party totals, direct/list decomposition, direct-win coverage, parliament size, majority threshold, metadata, ordering, and warnings before the UI receives it.

## Pre-2023 strategy

`de-2021-bwahlg` implements the electoral law used for the 2021 Bundestag election. It consumes the validated 598-seat state-contingent fixture and the district winners already resolved from the normalized scenario; it does not load JSON or derive population figures inside the calculator.

The calculator performs the historical stages separately: preliminary allocation of each active state's effective contingent, calculation of state and national party minimums, national upper allocation with up to three uncompensated overhang seats, and final state allocation subject to the state minimums. Direct wins of parties that do not qualify for proportional allocation are reserved and reduce the distributable contingent in their state.

The final chamber size is derived from the allocation rather than fixed at 598. Every modeled district winner receives a direct seat, and the result exposes direct/list totals, reserved direct seats, uncompensated overhang seats, and the dynamic majority threshold. The compact unfiltered reference fixture reproduces the documented 2021 result of 736 seats.

Inactive states keep their historical institutional contingent but receive no preliminary or final state-list seats. Filtered scenarios and inactive states return structured warnings instead of changing the fixed historical fixture.

## Fixed 630-seat strategy

`de-2023-fixed-630` applies the inclusive five-percent threshold, the three-direct-win rule, the explicit national-minority exemption, and exclusion of the aggregate `Sonstige` bucket.

The calculator allocates exactly 630 seats nationally among eligible parties and then allocates each party's seats among active state lists through the shared Sainte-Laguë helper. Inactive states receive no state seats, while the national chamber remains fixed at 630 seats.

Direct-seat coverage is calculated only at the aggregate party/state boundary required by the product. For every party and state, covered direct seats are the smaller of the party's state-seat allocation and its modeled district wins there. Additional wins are returned as `uncoveredDistrictWins`; no candidate identity or list position is derived.

## Union parallel strategy

`union-parallel` implements the configured 299 + 299 Grabenwahl model as two independent tiers.

The shared district-winner resolver supplies up to 299 direct seats. Every winner in a non-empty district receives a direct seat, including winners of parties that do not qualify for list allocation. Empty districts stay unallocated and reduce the actual chamber size instead of being reassigned or converted into list seats.

Independently, the calculator allocates exactly 299 list seats among eligible parties through the shared Sainte-Laguë helper and validates their distribution among active state lists. The five-percent threshold, three-direct-win rule, national-minority exemption, and `Sonstige` exclusion apply only to this list tier. Direct and list seats are never offset against each other.

The result exposes the 598-seat institutional capacity, actual allocated and unallocated direct seats, the fixed 299-seat list tier, direct/list totals by party, the resulting variable parliament size, and its majority threshold. Filters continue to affect both vote types and therefore may change district winners; inactive states leave their district seats vacant and receive no list allocation. Both cases remain visible through structured warnings.

Candidate names, state-list order, and person-level mandate assignment remain outside this module boundary.

Coalition calculation consumes the normalized party seat totals and the majority threshold returned by the selected calculator. It does not infer the chamber size or encode political compatibility.