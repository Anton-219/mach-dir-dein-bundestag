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

The parallel system remains recognized by the identifier type but unregistered until its implementation issue adds the calculator. Candidate names, state-list order, and person-level mandate assignment remain outside this module boundary.

Coalition calculation consumes the normalized party seat totals and the majority threshold returned by the selected calculator. It does not infer the chamber size or encode political compatibility.
